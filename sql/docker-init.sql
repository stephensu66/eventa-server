CREATE TABLE IF NOT EXISTS user_types (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'user type: free, free_invited, free_ngo, paid_personal, paid_company',
  is_paid BOOLEAN DEFAULT FALSE,
  is_invited BOOLEAN DEFAULT FALSE,
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  open_id VARCHAR(100) UNIQUE,
  username VARCHAR(50) DEFAULT NULL,
  email VARCHAR(100) UNIQUE DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  user_type_id BIGINT DEFAULT 1,
  avatar_url VARCHAR(255) DEFAULT NULL,
  nickname VARCHAR(50) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_updated_userInfo_time DATETIME,
  FOREIGN KEY (user_type_id) REFERENCES user_types(id),
  INDEX idx_user_type (user_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS user_publish_rules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_type_id BIGINT NOT NULL,
  max_events_per_month INT DEFAULT 2,
  max_images_per_event INT DEFAULT 1,
  max_videos_per_event INT DEFAULT 0,
  FOREIGN KEY (user_type_id) REFERENCES user_types(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_type_rule (user_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS user_check_status (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  total_events INT DEFAULT 0,
  total_images INT DEFAULT 0,
  total_logins INT DEFAULT 0,
  last_event_at DATETIME,
  last_login_at DATETIME,
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_stat (user_id),
  INDEX idx_updated_time (updated_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS user_feedbacks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  sender_type VARCHAR(20) NOT NULL DEFAULT 'wechat' COMMENT 'wechat, email, phone',
  sender_contact VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, handled',
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_feedback_user_time (user_id, created_time),
  INDEX idx_feedback_status_time (status, created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS events (
  event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_status TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '0: draft, 1:pending, 2:rejected, 3:active, 4:cancelled, 5:completed, 6:deleted, 7:suspended, 8: full',
  event_title VARCHAR(255) NOT NULL,
  event_description LONGTEXT DEFAULT NULL,
  is_free BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT FALSE,
  is_onsite BOOLEAN DEFAULT FALSE,
  longitude DECIMAL(10, 6),
  latitude DECIMAL(10, 6),
  full_address VARCHAR(512),
  link VARCHAR(512),
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  max_participate_num INT DEFAULT NULL COMMENT 'null means no limitation for participated people',
  host_id BIGINT NOT NULL COMMENT 'host user id',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  event_type TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1:event, 2:skill, 3:task',
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_event_status (event_status),
  INDEX idx_event_type (event_type),
  INDEX idx_host_id (host_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS event_contacts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  contact_type VARCHAR(50) NOT NULL COMMENT 'type: wechat, email, call, others',
  contact_value VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  UNIQUE KEY uniq_event_contact (event_id, contact_type),
  INDEX idx_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS event_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  image_url VARCHAR(1024) NOT NULL,
  file_type VARCHAR(50) NOT NULL DEFAULT 'image' COMMENT 'type: image, video',
  source_type VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT 'source: user, system',
  sort_order INT UNSIGNED DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  INDEX idx_event_id (event_id),
  INDEX idx_event_sort (event_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS event_participants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'joined' COMMENT 'type: joined, cancelled',
  role VARCHAR(50) NOT NULL DEFAULT 'participant' COMMENT 'roles: participant, cohost',
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participation (event_id, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_event_status (event_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS event_favorites (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  favorited_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (event_id, user_id),
  INDEX idx_user_fav (user_id, favorited_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL COMMENT 'users who receive message',
  event_id BIGINT DEFAULT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'custom' COMMENT 'types: event_signup_success, event_signup_cancel, event_cancelled, event_update, custom',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  INDEX idx_user_read_time (user_id, is_read, created_time),
  INDEX idx_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO user_types (type_name, is_paid, is_invited)
VALUES
  ('free', 0, 0),
  ('free_invited', 0, 1),
  ('free_ngo', 0, 0),
  ('paid_personal', 1, 0),
  ('paid_company', 1, 0)
ON DUPLICATE KEY UPDATE
  is_paid = VALUES(is_paid),
  is_invited = VALUES(is_invited);

INSERT INTO user_publish_rules (user_type_id, max_events_per_month, max_images_per_event, max_videos_per_event)
SELECT id, 2, 1, 1 FROM user_types WHERE type_name = 'free'
UNION ALL
SELECT id, 30, 10, 3 FROM user_types WHERE type_name = 'free_invited'
UNION ALL
SELECT id, 30, 10, 3 FROM user_types WHERE type_name = 'free_ngo'
UNION ALL
SELECT id, 10, 10, 3 FROM user_types WHERE type_name = 'paid_personal'
UNION ALL
SELECT id, 30, 20, 3 FROM user_types WHERE type_name = 'paid_company'
ON DUPLICATE KEY UPDATE
  max_events_per_month = VALUES(max_events_per_month),
  max_images_per_event = VALUES(max_images_per_event),
  max_videos_per_event = VALUES(max_videos_per_event);
