# 1. events 主表

CREATE TABLE events (
  event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_status ENUM('ACTIVE', 'CANCELLED', 'DELETED') DEFAULT 'ACTIVE' NOT NULL;
  event_title VARCHAR(255) NOT NULL,
  event_description TEXT,
  is_free BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT FAlSE,
  is_onsite BOOLEAN DEFAULT FALSE,
  longitude DECIMAL(10,6),
  latitude DECIMAL(10,6),
  full_address VARCHAR(512),
  link VARCHAR(512),
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  max_participate_num INT NOT NULL,
  host_id VARCHAR(255) NOT NULL,  -- 可用于存储用户名或访客 ID， 主办方
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  event_type TINYINT NOT NULL DEFAULT 1 COMMENT '1:event, 2:skill, 3:task'; 
  
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
);

# 2 event_contacts

CREATE TABLE event_contacts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  
  event_id BIGINT NOT NULL,
  contact_type ENUM('wechat', 'email', 'call', 'others') NOT NULL,
  contact_value VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

# 3. event_images

CREATE TABLE event_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  image_url VARCHAR(1024) NOT NULL,
  file_type ENUM('image','video') DEFAULT 'image',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  INDEX idx_event_id (event_id) 
);

# 4. event_participants

CREATE TABLE event_participants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  status ENUM('joined', 'cancelled') DEFAULT 'joined',  -- 参加状态，可扩展
  role ENUM('participant', 'cohost') DEFAULT 'participant', -- 角色，可扩展

  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE KEY unique_participation (event_id, user_id)
);

# 5. event_favorites

CREATE TABLE event_favorites (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  favorited_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE KEY unique_favorite (event_id, user_id)
);

# 6. notifications

CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,            -- 接收消息的用户
  event_id BIGINT,                    -- 相关活动（有的消息可能不关联活动，可以为 NULL）
  type ENUM(
    'EVENT_SIGNUP_SUCCESS',           -- 报名成功
    'EVENT_SIGNUP_CANCEL',            -- 报名取消
    'EVENT_CANCELLED',                -- 活动被取消
    'EVENT_UPDATED',                  -- 活动时间或内容更新
    'CUSTOM'                          -- 自定义通知（比如系统公告）
  ) NOT NULL,
  message TEXT NOT NULL,              -- 通知内容
  is_read BOOLEAN DEFAULT FALSE,      -- 是否已读
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,


  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);
