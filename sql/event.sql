/* 1. events main table */
CREATE TABLE events (
  event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_status TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '0: draft, 1:pending, 2:rejected, 3:active, 4:cancelled, 5:completed, 6:deleted, 7:suspended, 8: full',
  event_title VARCHAR(255) NOT NULL,
  event_description LONGTEXT DEFAULT NULL,
  is_free BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT FALSE,
  is_onsite BOOLEAN DEFAULT FALSE,
  longitude DECIMAL(10,6),
  latitude DECIMAL(10,6),
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

/* 7. user_feedbacks */

CREATE TABLE user_feedbacks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  sender_type VARCHAR(20) NOT NULL DEFAULT 'wechat' COMMENT 'wechat, email',
  sender_contact VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, handled',
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_feedback_user_time (user_id, created_time),
  INDEX idx_feedback_status_time (status, created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* 2 event_contacts */

CREATE TABLE event_contacts (
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

/* 3. event_images */

CREATE TABLE event_images (
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

/* 4. event_participants */

CREATE TABLE event_participants (
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
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*  5. event_favorites */

CREATE TABLE event_favorites (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  favorited_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE KEY unique_favorite (event_id, user_id),
  INDEX idx_user_fav (user_id, favorited_time)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*  6. notifications */ 

CREATE TABLE notifications (
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
