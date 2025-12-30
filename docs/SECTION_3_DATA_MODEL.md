# Section 3: Data Model

## 3.1 Introduction

This section presents the dimensional data model implemented for the academic assessment system. The data warehouse follows a hybrid dimensional schema design, incorporating elements of both star and snowflake schemas to balance query performance with data normalization. The schema diagram provided illustrates the complete structure, including one central fact table, six dimension tables, and two bridge tables that handle many-to-many relationships between assessment grades and learning outcomes, as well as assessment grades and program outcomes.

## 3.2 Schema Overview

The data model is structured as a star schema with snowflake characteristics, centered around the `Fact_AssessmentGrade` fact table. This fact table captures the core transactional data—student assessment grades—and connects to multiple dimension tables through foreign key relationships. The schema employs bridge tables to manage the many-to-many relationships between assessment grades and learning outcomes, and between assessment grades and program outcomes, enabling flexible analysis of student performance across different educational outcome dimensions.

### 3.2.1 Fact Table

**Fact_AssessmentGrade** serves as the central fact table, storing individual assessment grade records. Each record represents a student's performance on a specific assessment within a course at a particular point in time. The table includes foreign keys linking to student, course, assessment, and time dimensions, along with measures such as score, percentage, weighted contribution, passing status, and grade count.

### 3.2.2 Dimension Tables

The schema includes six dimension tables that provide descriptive context for the fact table:

- **Dim_Student**: Contains student demographic and academic information, including student identifiers, contact details, department affiliation, and year of study.

- **Dim_Course**: Stores course details such as course code, name, department, academic year, semester information, credits, and instructor details.

- **Dim_Assessment**: Maintains assessment metadata including title, type, maximum score, weight, and due date.

- **Dim_Time**: Provides temporal dimension attributes including date components (day, month, year), academic year, semester information, and quarter.

- **Dim_LearningOutcome**: Contains learning outcome definitions with codes, titles, descriptions, associated course information, target percentages, and active status.

- **Dim_ProgramOutcome**: Stores program-level outcome definitions including codes, titles, descriptions, department affiliation, target percentages, and active status.

### 3.2.3 Bridge Tables

Two bridge tables facilitate many-to-many relationships:

- **Fact_AssessmentGrade_Bridge_LO**: Connects assessment grades to learning outcomes, allowing a single grade to contribute to multiple learning outcomes with specified weights and contribution percentages.

- **Fact_AssessmentGrade_Bridge_PO**: Links assessment grades to program outcomes through the learning outcome hierarchy, enabling program-level performance analysis with weighted contributions.

## 3.3 Table Size Summary

The following table provides a comprehensive summary of all tables in the dimensional schema, including row counts, column counts, and raw storage sizes.

| Table Name | Number of Rows | Number of Columns | Raw Size |
|------------|----------------|-------------------|----------|
| Fact_AssessmentGrade | 1,200 | 10 | 688 kB |
| Dim_Student | 53 | 8 | 296 kB |
| Dim_Course | 6 | 10 | 112 kB |
| Dim_Assessment | 24 | 6 | 128 kB |
| Dim_Time | 0* | 9 | 0 kB |
| Dim_LearningOutcome | 18 | 9 | 64 kB |
| Dim_ProgramOutcome | 7 | 7 | 64 kB |
| Fact_AssessmentGrade_Bridge_LO | 51 | 5 | 104 kB |
| Fact_AssessmentGrade_Bridge_PO | 35 | 5 | 72 kB |

*Note: Dim_Time is implemented as a derived dimension, with temporal attributes extracted from date fields in other tables rather than maintained as a separate physical table.

## 3.4 Schema Architecture Discussion

### 3.4.1 Hybrid Dimensional Schema

The implemented schema represents a hybrid approach that combines characteristics of both star and snowflake schemas. The core structure follows a star schema pattern, with the fact table directly connected to dimension tables through foreign key relationships. However, the schema exhibits snowflake characteristics through the normalization of certain dimension attributes and the use of bridge tables to manage complex many-to-many relationships.

The hybrid design provides several advantages: it maintains query performance through the star schema's denormalized structure while achieving data consistency and reducing redundancy through selective normalization. This approach is particularly beneficial for educational data warehousing, where both analytical query performance and data integrity are critical requirements.

### 3.4.2 Snowflake-Dominant Characteristics

While the schema maintains star schema elements, it demonstrates snowflake-dominant characteristics in several areas. The dimension tables are partially normalized, with some attributes that could be further decomposed into separate dimension tables. For instance, the `Dim_Course` table includes both course-level attributes and instructor information, which could be separated into distinct dimensions in a fully snowflaked design.

The bridge tables represent a form of snowflaking, as they normalize the many-to-many relationships between the fact table and the learning outcome and program outcome dimensions. This normalization prevents data redundancy that would occur if these relationships were directly embedded in the fact table, while maintaining the flexibility to associate multiple outcomes with each assessment grade.

Additionally, the learning outcome and program outcome dimensions maintain hierarchical relationships through the bridge tables, creating a snowflake-like structure that supports multi-level analysis of student performance from assessment-level metrics up to program-level outcomes.

### 3.4.3 Partial Normalization and Denormalization

The schema employs a strategic balance between normalization and denormalization. Dimension tables are denormalized to include frequently accessed attributes together, reducing the need for joins during analytical queries. For example, `Dim_Student` combines student identification, contact information, and academic attributes in a single table, while `Dim_Course` includes both course details and instructor information.

Conversely, the schema normalizes the many-to-many relationships through bridge tables, preventing the duplication of fact table records that would occur if these relationships were denormalized. The bridge tables also include weight and contribution percentage attributes, which are specific to each relationship instance and would be inappropriate to store directly in the fact or dimension tables.

The time dimension is implemented as a derived dimension rather than a physical table, with temporal attributes extracted from date fields in the fact and other dimension tables. This approach reduces storage requirements while maintaining the analytical benefits of a time dimension.

This partial normalization strategy optimizes the schema for both storage efficiency and query performance, ensuring that the most frequently accessed data is readily available while maintaining referential integrity and avoiding unnecessary data duplication.


