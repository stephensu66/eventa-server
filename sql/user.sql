/*  1.创建用户类型(user_types) */

CREATE TABLE user_types (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'user type: free, free_invited, free_ngo, paid_personal, paid_company',
  is_paid BOOLEAN DEFAULT FALSE,
  is_invited BOOLEAN DEFAULT FALSE,

  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* 2.创建用户(users)
# avatarurl 和nickname 首次可以默认微信，但增加用户修改权限。以正式名字出现。 */

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  open_id VARCHAR(100) UNIQUE,
  username VARCHAR(50) DEFAULT NULL,
  email VARCHAR(100) UNIQUE DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL ,
  user_type_id BIGINT DEFAULT 1,

  avatar_url VARCHAR(255) DEFAULT NULL,
  nickname VARCHAR(50) DEFAULT NULL,
  description TEXT DEFAULT NULL,

  created_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_updated_userInfo_time DATETIME,
  FOREIGN KEY (user_type_id) REFERENCES user_types(id),

  INDEX idx_user_type (user_type_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*  3. 用户上传权限
# 通过后端逻辑或定时任务重置用户月发布次数。 */

CREATE TABLE user_publish_rules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_type_id BIGINT NOT NULL,

  max_events_per_month INT DEFAULT 2,
  max_images_per_event INT DEFAULT 1,
  max_videos_per_event INT DEFAULT 0,
  FOREIGN KEY (user_type_id) REFERENCES user_types(id) ON DELETE CASCADE,

  UNIQUE KEY uniq_type_rule (user_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*  4. 用户行为统计 */

CREATE TABLE user_check_status (
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

