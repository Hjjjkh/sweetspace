import { jsonResponse } from '../index.js';

/**
 * 文件上传处理器 (R2)
 */
export async function handleUpload(request, env, user) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return jsonResponse(
        { error: 'Validation Error', message: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = env.ALLOWED_TYPES?.split(',') || [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime'
    ];

    if (!allowedTypes.includes(file.type)) {
      return jsonResponse(
        { error: 'Invalid file type', message: `支持的文件类型：${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // 验证文件大小
    const maxSize = parseInt(env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return jsonResponse(
        { error: 'File too large', message: `文件大小不能超过 ${maxSize / 1024 / 1024}MB` },
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
      }
    });

    // 生成访问 URL
    const fileUrl = `https://storage.love-space.workers.dev/${r2Key}`;

    return jsonResponse({
      success: true,
      message: '上传成功',
      data: {
        r2_key: r2Key,
        url: fileUrl,
        filename: file.name,
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
 * 删除文件
 */
export async function deleteFile(env, user, r2Key) {
  try {
    // 验证文件所有权
    const keyParts = r2Key.split('/');
    const fileOwnerId = keyParts[2];

    if (fileOwnerId !== user.id) {
      return { success: false, error: '无权限删除此文件' };
    }

    await env.BUCKET.delete(r2Key);

    return { success: true };

  } catch (error) {
    console.error('Delete file error:', error);
    return { success: false, error: error.message };
  }
}
