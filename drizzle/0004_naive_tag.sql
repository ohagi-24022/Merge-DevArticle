CREATE TABLE `completed_apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`repoOwner` varchar(255),
	`repoName` varchar(255),
	`appUrl` text,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `completed_apps_id` PRIMARY KEY(`id`)
);
