CREATE TABLE IF NOT EXISTS `post` (
  `post_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk__post__user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB;
