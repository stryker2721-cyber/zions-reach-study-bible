CREATE TABLE `aiUsageTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`usageCount` int NOT NULL DEFAULT 0,
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiUsageTracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `highlights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`book` varchar(64) NOT NULL,
	`chapter` int NOT NULL,
	`verse` int NOT NULL,
	`text` text NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT 'yellow',
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `highlights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('free','trial','monthly','yearly','lifetime') NOT NULL DEFAULT 'free',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`status` enum('active','past_due','canceled','trialing') DEFAULT 'active',
	`trialStartsAt` timestamp,
	`trialEndsAt` timestamp,
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`canceledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSubscriptions_userId_unique` UNIQUE(`userId`)
);
