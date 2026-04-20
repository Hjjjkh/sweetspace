import { jsonResponse } from '../index.js';

/**
 * 文件上传处理器 (使用 D1 数据库存储 Base64)
 * 简化版本，适合中小图片
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return jsonResponse(
        { error: 'Invalid file type', message: '仅支持图片格式 (JPG, PNG, GIF, WebP)' },
        { status: 400 }
      );
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return jsonResponse(
        { error: 'File too large', message: '文件大小不能超过 5MB' },
        { status: 400 }
      );
    }

    // 读取文件为 Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = arrayBufferToBase64(arrayBuffer);
    
    // 生成 ID
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // 存入 D1 数据库
    await env.DB.prepare(`
      INSERT INTO gallery_photos (id, user_id, title, description, file_data, file_type, file_size, taken_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.id,
      title,
      description,
      base64String,
      file.type,
      file.size,
      takenAt,
      timestamp
    ).run();

    return jsonResponse({
      success: true,
      message: '上传成功',
      data: {
        id: id,
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
      SELECT id, user_id, title, description, file_type, file_size, taken_at, created_at,
             (SELECT name FROM users WHERE id = gallery_photos.user_id) as uploader_name
      FROM gallery_photos
      ORDER BY created_at DESC
    `).all();

    // 为每张照片生成数据 URL
    const photos = results.map(photo => ({
      ...photo,
      file_url: `data:${photo.file_type};base64,${photo.file_data || photo.thumbnail_data}`
    }));

    return jsonResponse({
      success: true,
      data: { photos }
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
    // 验证照片所有权
    const { success } = await env.DB.prepare(`
      DELETE FROM gallery_photos 
      WHERE id = ? AND user_id = ?
    `).bind(photoId, user.id).run();

    if (!success) {
      return jsonResponse(
        { error: 'Delete failed', message: '无法删除照片' },
        { status: 500 }
      );
    }

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
 * ArrayBuffer 转 Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
