# 1.创建用户类型(user_types)

CREATE TABLE user_types (
  id TINYINT PRIMARY KEY AUTO_INCREMENT,
  type_name ENUM('free', 'free_invited', 'free_ngo', 'paid_personal', 'paid_company') 
            NOT NULL DEFAULT 'free',
  is_paid BOOLEAN DEFAULT FALSE,
  is_invited BOOLEAN DEFAULT FALSE
);

# 2.创建用户(users)
# avatarurl 和nickname 首次可以默认微信，但增加用户修改权限。以正式名字出现。

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  open_id VARCHAR(100) UNIQUE,
  username VARCHAR(50),
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  user_type_id TINYINT DEFAULT 1,
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,

  avatar_url VARCHAR(255),
  nickname VARCHAR(50),
  description TEXT,
  last_updated_userInfo_time DATETIME,
  FOREIGN KEY (user_type_id) REFERENCES user_types(id)
);

# 3. 用户上传权限
# 通过后端逻辑或定时任务重置用户月发布次数。

CREATE TABLE user_publish_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_type_id TINYINT NOT NULL,
  max_events_per_month INT DEFAULT 2,
  max_images_per_event INT DEFAULT 1,
  FOREIGN KEY (user_type_id) REFERENCES user_types(id)
);

#  4. 用户行为统计

CREATE TABLE user_check_status (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  total_events INT DEFAULT 0,
  total_images INT DEFAULT 0,
  total_logins INT DEFAULT 0,
  last_event_at DATETIME,
  last_login_at DATETIME,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

