# Requirements Document

## Introduction

The Kasturi Eye Hospitals Management System is a web-based application that digitally manages the complete workflow of an eye hospital — from patient registration and prescription entry through order placement, billing, invoice generation, order tracking, and delivery notification. The system supports both desktop admin workflows and mobile-friendly quick entry, with WhatsApp integration for patient communication and audit logging for data integrity.

---

## Glossary

- **System**: The Kasturi Eye Hospitals Management System
- **Patient**: A person who visits Kasturi Eye Hospitals for eye care
- **Prescription**: An eye prescription containing optical parameters for one or both eyes
- **OD (Right Eye)**: Oculus Dexter — the patient's right eye
- **OS (Left Eye)**: Oculus Sinister — the patient's left eye
- **SPH**: Sphere — the lens power required to correct vision
- **CYL**: Cylinder — the lens power required to correct astigmatism
- **Axis**: The angle (0–180°) of the cylindrical correction
- **Vision_Type**: Classification of prescription as Far (distance) or Near (reading)
- **Order**: A purchase record associated with a patient, containing frames, lenses, and/or drops
- **Frame**: An eyeglass frame product associated with an order
- **Lens**: An optical lens product associated with an order
- **Drop**: An eye drop medication associated with an order
- **Invoice**: A billing document generated for a patient's order
- **Order_Status**: The current stage of an order in the fulfillment workflow
- **Dashboard**: The main administrative overview screen
- **WhatsApp_Notification**: A message sent to a patient via WhatsApp
- **Audit_Log**: A permanent record of all data creation and modification events
- **Brand**: A named manufacturer of frames or lenses managed in the system
- **Staff**: An authorized hospital employee who operates the system

---

## Requirements

### Requirement 1: Patient Registration

**User Story:** As a Staff member, I want to register new patients with their personal details, so that I can associate prescriptions and orders with the correct individual.

#### Acceptance Criteria

1. THE System SHALL provide a patient registration form with the following mandatory fields: Name, Phone Number, Age, and Address.
2. WHEN a Staff member submits a new patient registration form, THE System SHALL save the patient record and assign a unique patient identifier.
3. WHEN a Staff member submits a registration form with a missing mandatory field, THE System SHALL display a field-level validation error and prevent submission.
4. THE System SHALL store all patient records permanently with no delete option available to any user role.

---

### Requirement 2: Patient Search and Returning Patient Detection

**User Story:** As a Staff member, I want to search for existing patients and be alerted when a returning patient is detected, so that I can retrieve previous records without creating duplicates.

#### Acceptance Criteria

1. WHEN a Staff member enters a name or phone number in the search field, THE System SHALL return matching patient records within 2 seconds.
2. WHEN a Staff member enters a phone number that matches an existing patient record, THE System SHALL display a "Returning Patient" indicator and present the existing patient's details.
3. WHEN a search query returns no results, THE System SHALL display a "No patient found" message and offer a link to the new patient registration form.
4. THE System SHALL display all previous prescriptions and orders associated with a returning patient's record.

---

### Requirement 3: Manual Prescription Entry

**User Story:** As a Staff member, I want to manually enter eye prescription details for a patient, so that the optical parameters are recorded accurately for order fulfillment.

#### Acceptance Criteria

1. WHEN a Staff member initiates a new prescription for a patient, THE System SHALL present input fields for OD (Right Eye) and OS (Left Eye), each containing SPH, CYL, Axis, and Vision_Type (Far/Near).
2. WHEN a Staff member submits a prescription, THE System SHALL validate that Axis is a numeric value between 0 and 180 inclusive, and display an error if the value is outside this range.
3. WHEN a Staff member submits a valid prescription, THE System SHALL save the prescription linked to the patient record and display it in the patient's prescription history.
4. THE System SHALL allow multiple prescriptions to be saved per patient without overwriting previous entries.
5. THE System SHALL provide no option to delete any saved prescription.

---

### Requirement 4: Prescription Image/PDF Upload

**User Story:** As a Staff member, I want to upload a prescription image or PDF for a patient, so that physical or scanned prescriptions can be stored digitally alongside manual entries.

#### Acceptance Criteria

1. WHEN a Staff member selects the upload option for a prescription, THE System SHALL accept files in JPEG, PNG, and PDF formats.
2. WHEN a Staff member uploads a file exceeding 10 MB, THE System SHALL display an error message and reject the upload.
3. WHEN a valid prescription file is uploaded, THE System SHALL store the file linked to the patient record and display a thumbnail or file name in the patient's prescription history.
4. WHERE the device has a camera, THE System SHALL provide a camera capture option to photograph and upload a prescription directly.

---

### Requirement 5: Order Creation

**User Story:** As a Staff member, I want to create an order for a patient containing frames, lenses, and/or drops, so that the hospital can fulfill the patient's optical and medication needs.

#### Acceptance Criteria

1. WHEN a Staff member initiates a new order, THE System SHALL require a linked patient record before allowing order submission.
2. THE System SHALL allow an order to include one or more of the following item types: Frame, Lens, and Drop.
3. WHEN a Staff member adds a Frame to an order, THE System SHALL require selection of a Frame Brand and a quantity, and allow an optional frame image upload.
4. WHEN a Staff member adds a Lens to an order, THE System SHALL require selection of a Lens Brand and entry of power details.
5. WHEN a Staff member adds a Drop to an order, THE System SHALL require entry of the drop name and quantity.
6. THE System SHALL allow a Staff member to enter a manual total amount for the order.
7. WHEN a Staff member submits an order with no items, THE System SHALL display a validation error and prevent submission.
8. WHEN a valid order is submitted, THE System SHALL save the order with an initial Order_Status of "Ordered" and link it to the patient record.

---

### Requirement 6: Order Status Management

**User Story:** As a Staff member, I want to track and update the status of each order through its fulfillment lifecycle, so that patients and staff always know the current state of an order.

#### Acceptance Criteria

1. THE System SHALL support the following Order_Status values in sequence: Ordered → Processing → Ready for Pickup → Delivered.
2. WHEN a Staff member manually updates an order's status, THE System SHALL record the new status and the timestamp of the change.
3. WHEN an order has been in "Ordered" or "Processing" status for 2 or more days without a manual status update, THE System SHALL automatically transition the Order_Status to "Ready for Pickup".
4. WHEN an order has been in "Ready for Pickup" status for 3 or more days without being marked "Delivered", THE System SHALL flag the order as "Delayed" on the Dashboard.
5. WHILE an order has Order_Status of "Delivered", THE System SHALL prevent any further status changes to that order.

---

### Requirement 7: Billing and Invoice Generation

**User Story:** As a Staff member, I want to generate and download a billing invoice for a patient's order, so that the patient receives a formal record of their purchase.

#### Acceptance Criteria

1. WHEN a Staff member requests an invoice for an order, THE System SHALL generate an invoice containing: Hospital Name, Doctor Name, Patient Name, Phone Number, Address, Date, item details (name, quantity, price), and Total Amount.
2. WHEN an invoice is generated, THE System SHALL make it available for download in PDF format.
3. WHEN a Staff member downloads an invoice, THE System SHALL record the download event in the Audit_Log with the Staff member's identity and timestamp.
4. IF an order has no total amount entered, THEN THE System SHALL display a warning before generating the invoice and require confirmation to proceed.

---

### Requirement 8: Dashboard Overview

**User Story:** As a Staff member, I want a dashboard that shows key operational metrics at a glance, so that I can quickly assess the hospital's daily workload and order pipeline.

#### Acceptance Criteria

1. THE Dashboard SHALL display the following counters, updated in real time: Today's Patients, Active Orders, Processing Orders, Ready for Pickup, Delayed Orders, and Delivered Orders.
2. WHEN a Staff member clicks a dashboard counter, THE System SHALL navigate to a filtered list view showing the orders or patients corresponding to that counter.
3. WHILE the Dashboard is open, THE System SHALL refresh all counters automatically every 60 seconds.

---

### Requirement 9: WhatsApp Notification

**User Story:** As a Staff member, I want to send a WhatsApp notification to a patient when their order is ready for pickup, so that the patient is informed promptly without manual phone calls.

#### Acceptance Criteria

1. WHEN a Staff member clicks the "Send WhatsApp" button on an order, THE System SHALL open a WhatsApp message pre-populated with the text: "Hello {Patient Name}, your glasses are ready for pickup at Kasturi Eye Hospitals." where {Patient Name} is replaced with the patient's registered name.
2. WHEN a WhatsApp notification is sent, THE System SHALL record the sent timestamp and the identity of the Staff member who triggered the send.
3. THE System SHALL display the last sent timestamp and sender name on the order detail view for any order that has had a WhatsApp notification sent.
4. WHEN a Staff member attempts to send a WhatsApp notification for an order whose Order_Status is not "Ready for Pickup", THE System SHALL display a confirmation prompt before proceeding.

---

### Requirement 10: Reports and Filters

**User Story:** As a Staff member, I want to generate monthly reports and filter patient and order records, so that I can analyze hospital activity and locate specific records efficiently.

#### Acceptance Criteria

1. THE System SHALL provide a monthly report showing the total count of new patients registered and total orders placed, grouped by calendar month.
2. WHEN a Staff member applies a filter by Name, Phone Number, Address, Date, or Order_Status, THE System SHALL return matching records within 2 seconds.
3. WHEN multiple filters are applied simultaneously, THE System SHALL return records that satisfy all applied filter conditions.
4. WHEN a filter returns no results, THE System SHALL display a "No records found" message.

---

### Requirement 11: Data Security and Audit Logging

**User Story:** As a hospital administrator, I want all data changes to be permanently logged and no records to be deletable, so that the system maintains a complete and tamper-evident history.

#### Acceptance Criteria

1. THE System SHALL provide no delete functionality for patient records, prescriptions, or orders to any user role.
2. WHEN any patient record, prescription, or order is created or edited, THE System SHALL write an entry to the Audit_Log containing: the record type, record identifier, the nature of the change, the Staff member's identity, and the timestamp.
3. THE Audit_Log SHALL be read-only; no user role SHALL be able to modify or delete audit log entries.
4. WHEN a Staff member edits an existing record, THE System SHALL preserve the previous field values in the Audit_Log before applying the update.

---

### Requirement 12: Device Support

**User Story:** As a Staff member, I want the system to work well on both desktop and mobile devices, so that I can manage patients and orders from any device available in the hospital.

#### Acceptance Criteria

1. THE System SHALL render a full administrative dashboard layout on desktop screens with a minimum width of 1024px.
2. THE System SHALL render a touch-friendly, responsive layout on mobile screens with a minimum width of 320px.
3. WHERE the device has a camera, THE System SHALL provide camera-based image capture for prescription and frame image uploads.
4. THE System SHALL complete all patient entry form interactions on mobile without requiring horizontal scrolling.

---

### Requirement 13: Brands Management

**User Story:** As a Staff member, I want to manage the list of frame and lens brands, so that order entry always reflects the current product catalogue.

#### Acceptance Criteria

1. THE System SHALL provide a Brands Management section where Staff can view all existing Frame Brands and Lens Brands.
2. WHEN a Staff member submits a new brand name, THE System SHALL validate that the name is non-empty and unique within its brand type, then save the brand.
3. WHEN a Staff member submits a duplicate brand name within the same brand type, THE System SHALL display an error and prevent the duplicate from being saved.
4. WHEN a Staff member edits an existing brand name, THE System SHALL update all existing order records that reference the old brand name to reflect the new name.
5. THE System SHALL provide no option to delete a brand that is referenced by one or more existing orders.
