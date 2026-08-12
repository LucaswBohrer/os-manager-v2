ALTER TABLE `equipments` ADD CONSTRAINT `equipments_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `osHistory` ADD CONSTRAINT `osHistory_serviceOrderId_serviceOrders_id_fk` FOREIGN KEY (`serviceOrderId`) REFERENCES `serviceOrders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `osParts` ADD CONSTRAINT `osParts_serviceOrderId_serviceOrders_id_fk` FOREIGN KEY (`serviceOrderId`) REFERENCES `serviceOrders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `osParts` ADD CONSTRAINT `osParts_partId_parts_id_fk` FOREIGN KEY (`partId`) REFERENCES `parts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `serviceOrders` ADD CONSTRAINT `serviceOrders_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `serviceOrders` ADD CONSTRAINT `serviceOrders_equipmentId_equipments_id_fk` FOREIGN KEY (`equipmentId`) REFERENCES `equipments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `serviceOrders` ADD CONSTRAINT `serviceOrders_originalOsId_serviceOrders_id_fk` FOREIGN KEY (`originalOsId`) REFERENCES `serviceOrders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `equipments_client_idx` ON `equipments` (`clientId`);--> statement-breakpoint
CREATE INDEX `os_history_service_order_idx` ON `osHistory` (`serviceOrderId`);--> statement-breakpoint
CREATE INDEX `os_parts_service_order_idx` ON `osParts` (`serviceOrderId`);--> statement-breakpoint
CREATE INDEX `os_parts_part_idx` ON `osParts` (`partId`);--> statement-breakpoint
CREATE INDEX `service_orders_client_idx` ON `serviceOrders` (`clientId`);--> statement-breakpoint
CREATE INDEX `service_orders_equipment_idx` ON `serviceOrders` (`equipmentId`);--> statement-breakpoint
CREATE INDEX `service_orders_status_idx` ON `serviceOrders` (`status`);