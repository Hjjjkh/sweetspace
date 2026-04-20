import { jsonResponse } from '../index.js';

/**
 * 文件上传处理器 (使用 Cloudflare R2 存储)
 */
export async function handleUpload(request, env, user, ctx) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title') || file.name;
    const description = formData.get('description') || '';
    const takenAt = formData.get('taken_at') ? new Date(formData.get('taken_at')).getTime() / 1000 : null;

    if (!file) {
      return jsonResponse(
        { error: 'Validation Error', message: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return jsonResponse(
        { error: 'Invalid file type', message: '支持的文件类型：图片 (JPG, PNG, GIF, WebP) 和视频 (MP4, MOV)' },
        { status: 400 }
      );
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return jsonResponse(
        { error: 'File too large', message: '文件大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // 生成文件名
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const r2Key = `uploads/${user.id}/${timestamp}-${randomStr}.${fileExt}`;

    // 上传到 R2
    await env.BUCKET.put(r2Key, file, {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: {
        userId: user.id,
        title: title,
        description: description
      }
    });

    // 生成访问 URL (使用 R2 公共访问或签名 URL)
    const fileUrl = getR2FileUrl(env, r2Key);

    // 存入数据库记录
    const id = crypto.randomUUID();
    const timestamp_str = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO gallery_photos (id, user_id, title, description, file_url, file_type, file_size, taken_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.id,
      title,
      description,
      fileUrl,
      file.type,
      file.size,
      takenAt,
      timestamp_str
    ).run();

    return jsonResponse({
      success: true,
      message: '上传成功',
      data: {
        id: id,
        url: fileUrl,
        title: title,
        size: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return jsonResponse(
      { error: 'Upload failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 获取照片列表
 */
export async function handleGetPhotos(env, user) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT id, user_id, title, description, file_url, file_type, file_size, taken_at, created_at,
             (SELECT name FROM users WHERE id = gallery_photos.user_id) as uploader_name
      FROM gallery_photos
      ORDER BY created_at DESC
    `).all();

    return jsonResponse({
      success: true,
      data: { photos: results }
    });

  } catch (error) {
    console.error('Get photos error:', error);
    return jsonResponse(
      { error: 'Failed to fetch photos', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 删除照片
 */
export async function handleDeletePhoto(env, user, photoId) {
  try {
    // 先获取照片信息
    const photo = await env.DB.prepare(`
      SELECT file_url FROM gallery_photos 
      WHERE id = ? AND user_id = ?
    `).bind(photoId, user.id).first();

    if (!photo) {
      return jsonResponse(
        { error: 'Photo not found', message: '照片不存在或无权删除' },
        { status: 404 }
      );
    }

    // 从 R2 删除文件
    const r2Key = extractR2KeyFromUrl(photo.file_url);
    if (r2Key) {
      await env.BUCKET.delete(r2Key);
    }

    // 从数据库删除记录
    await env.DB.prepare(`
      DELETE FROM gallery_photos 
      WHERE id = ? AND user_id = ?
    `).bind(photoId, user.id).run();

    return jsonResponse({
      success: true,
      message: '删除成功'
    });

  } catch (error) {
    console.error('Delete photo error:', error);
    return jsonResponse(
      { error: 'Delete failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 生成 R2 文件访问 URL
 */
function getR2FileUrl(env, r2Key) {
  // 如果配置了 R2 公共访问域名，使用公共访问
  const r2PublicUrl = env.R2_PUBLIC_URL;
  if (r2PublicUrl) {
    return `${r2PublicUrl}/${r2Key}`;
  }

  // 否则使用 Worker 域名作为代理
  // 前端通过 /api/upload/:key 访问
  return `/api/upload/${encodeURIComponent(r2Key)}`;
}

/**
 * 从 URL 中提取 R2 Key
 */
function extractR2KeyFromUrl(url) {
  if (!url) return null;
  
  // 如果是相对路径（代理模式）
  if (url.startsWith('/api/upload/')) {
    return decodeURIComponent(url.replace('/api/upload/', ''));
  }
  
  // 如果是完整 URL，提取 key 部分
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // 假设路径格式为 /bucket-name/uploads/user-id/...
    const uploadsIndex = pathParts.indexOf('uploads');
    if (uploadsIndex !== -1) {
      return pathParts.slice(uploadsIndex).join('/');
    }
  } catch (e) {
    // URL 解析失败，返回 null
  }
  
  return null;
}

/**
 * 提供 R2 文件下载（代理模式）
 */
export async function handleDownloadFile(env, r2Key) {
  try {
    const object = await env.BUCKET.get(r2Key);
    
    if (!object) {
      return jsonResponse(
        { error: 'File not found', message: '文件不存在' },
        { status: 404 }
      );
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Content-Disposition', `inline; filename="${r2Key.split('/').pop()}"`);
    
    return new Response(object.body, {
      headers,
    });

  } catch (error) {
    console.error('Download error:', error);
    return jsonResponse(
      { error: 'Download failed', message: error.message },
      { status: 500 }
    );
  }
}
