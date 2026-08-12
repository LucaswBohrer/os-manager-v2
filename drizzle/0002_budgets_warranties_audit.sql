CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`author` varchar(128) NOT NULL,
	`action` varchar(128) NOT NULL,
	`entity` varchar(64) NOT NULL,
	`entityId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceOrderId` int NOT NULL,
	`subtotalParts` decimal(10,2) NOT NULL DEFAULT '0.00',
	`subtotalLabor` decimal(10,2) NOT NULL DEFAULT '0.00',
	`discount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`additionalFee` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL DEFAULT '0.00',
	`status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
	`validUntil` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `warranties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceOrderId` int NOT NULL,
	`returnOsId` int,
	`warrantyDays` int NOT NULL DEFAULT 90,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`terms` text,
	`status` enum('active','expired','claimed','void') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_serviceOrderId_serviceOrders_id_fk` FOREIGN KEY (`serviceOrderId`) REFERENCES `serviceOrders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warranties` ADD CONSTRAINT `warranties_serviceOrderId_serviceOrders_id_fk` FOREIGN KEY (`serviceOrderId`) REFERENCES `serviceOrders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warranties` ADD CONSTRAINT `warranties_returnOsId_serviceOrders_id_fk` FOREIGN KEY (`returnOsId`) REFERENCES `serviceOrders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `auditLogs` (`entity`,`entityId`);--> statement-breakpoint
CREATE INDEX `budgets_service_order_idx` ON `budgets` (`serviceOrderId`);--> statement-breakpoint
CREATE INDEX `warranties_service_order_idx` ON `warranties` (`serviceOrderId`);