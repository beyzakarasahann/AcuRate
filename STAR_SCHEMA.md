# Star Schema - Data Model

## Data Model Diagram

```mermaid
DerDiagram
    Dim_Student ||--o{ Fact_AssessmentGrade : "student_id"
    Dim_Course ||--o{ Fact_AssessmentGrade : "course_id"
    Dim_Assessment ||--o{ Fact_AssessmentGrade : "assessment_id"
    Dim_Time ||--o{ Fact_AssessmentGrade : "time_id"
    
    Fact_AssessmentGrade ||--o{ Fact_AssessmentGrade_Bridge_LO : "assessment_grade_id"
    Dim_LearningOutcome ||--o{ Fact_AssessmentGrade_Bridge_LO : "learning_outcome_id"
    
    Fact_AssessmentGrade ||--o{ Fact_AssessmentGrade_Bridge_PO : "assessment_grade_id"
    Dim_ProgramOutcome ||--o{ Fact_AssessmentGrade_Bridge_PO : "program_outcome_id"

    Fact_AssessmentGrade {
        int assessment_grade_id PK
        int student_id FK
        int course_id FK
        int assessment_id FK
        int time_id FK
        decimal score
        decimal percentage
        decimal weighted_contribution
        boolean is_passing
        int grade_count
    }

    Dim_Student {
        int student_id PK
        string student_id_original
        string student_username
        string student_email
        string full_name
        string department_name
        int year_of_study
        boolean is_active
    }

    Dim_Course {
        int course_id PK
        string course_code
        string course_name
        string department_name
        string academic_year
        string semester_name
        int semester_number
        int credits
        string teacher_name
        string teacher_email
    }

    Dim_Assessment {
        int assessment_id PK
        string assessment_title
        string assessment_type
        decimal max_score
        decimal weight
        date due_date
    }

    Dim_LearningOutcome {
        int learning_outcome_id PK
        string lo_code
        string lo_title
        string lo_description
        string course_code
        string course_name
        string department_name
        decimal target_percentage
        boolean is_active
    }

    Dim_ProgramOutcome {
        int program_outcome_id PK
        string po_code
        string po_title
        string po_description
        string department_name
        decimal target_percentage
        boolean is_active
    }

    Dim_Time {
        int time_id PK
        date date
        int day
        int month
        int year
        string academic_year
        string semester
        int semester_number
        int quarter
    }

    Fact_AssessmentGrade_Bridge_LO {
        int bridge_lo_id PK
        int assessment_grade_id FK
        int learning_outcome_id FK
        decimal weight
        decimal contribution_percentage
    }

    Fact_AssessmentGrade_Bridge_PO {
        int bridge_po_id PK
        int assessment_grade_id FK
        int program_outcome_id FK
        decimal weight
        decimal contribution_percentage
    }
```

## Tables Used in Database

### Fact Table

**Fact_AssessmentGrade**
- **Purpose**: Central fact table storing student assessment grades
- **Grain**: One student's score for one assessment
- **Primary Key**: assessment_grade_id
- **Foreign Keys**: student_id, course_id, assessment_id, time_id
- **Measures**: score, percentage, weighted_contribution, is_passing, grade_count
- **Estimated Rows**: 50,000 - 200,000 (depends on number of students × assessments)
- **Columns**: 9 (1 PK + 4 FK + 5 measures)
- **Estimated Size**: ~2-8 MB (assuming 40 bytes per row)

### Dimension Tables

**Dim_Student**
- **Purpose**: Student dimension with denormalized attributes
- **Primary Key**: student_id
- **Attributes**: student_id_original, student_username, student_email, full_name, department_name, year_of_study, is_active
- **Estimated Rows**: 1,000 - 10,000 students
- **Columns**: 8 (1 PK + 7 attributes)
- **Estimated Size**: ~200 KB - 2 MB (assuming 200 bytes per row)

**Dim_Course**
- **Purpose**: Course dimension with denormalized teacher information
- **Primary Key**: course_id
- **Attributes**: course_code, course_name, department_name, academic_year, semester_name, semester_number, credits, teacher_name, teacher_email
- **Estimated Rows**: 100 - 1,000 courses
- **Columns**: 10 (1 PK + 9 attributes)
- **Estimated Size**: ~20 KB - 200 KB (assuming 200 bytes per row)

**Dim_Assessment**
- **Purpose**: Assessment dimension with assessment details
- **Primary Key**: assessment_id
- **Attributes**: assessment_title, assessment_type, max_score, weight, due_date
- **Estimated Rows**: 500 - 5,000 assessments
- **Columns**: 6 (1 PK + 5 attributes)
- **Estimated Size**: ~30 KB - 300 KB (assuming 60 bytes per row)

**Dim_LearningOutcome**
- **Purpose**: Learning Outcome dimension with denormalized course information
- **Primary Key**: learning_outcome_id
- **Attributes**: lo_code, lo_title, lo_description, course_code, course_name, department_name, target_percentage, is_active
- **Estimated Rows**: 500 - 5,000 learning outcomes
- **Columns**: 9 (1 PK + 8 attributes)
- **Estimated Size**: ~50 KB - 500 KB (assuming 100 bytes per row)

**Dim_ProgramOutcome**
- **Purpose**: Program Outcome dimension
- **Primary Key**: program_outcome_id
- **Attributes**: po_code, po_title, po_description, department_name, target_percentage, is_active
- **Estimated Rows**: 10 - 50 program outcomes
- **Columns**: 7 (1 PK + 6 attributes)
- **Estimated Size**: ~1 KB - 5 KB (assuming 100 bytes per row)

**Dim_Time**
- **Purpose**: Time dimension for temporal analysis
- **Primary Key**: time_id
- **Attributes**: date, day, month, year, academic_year, semester, semester_number, quarter
- **Estimated Rows**: 365 - 1,825 (1-5 years of daily records)
- **Columns**: 9 (1 PK + 8 attributes)
- **Estimated Size**: ~15 KB - 75 KB (assuming 40 bytes per row)

### Bridge Tables

**Fact_AssessmentGrade_Bridge_LO**
- **Purpose**: Bridge table for many-to-many relationship between Fact_AssessmentGrade and Dim_LearningOutcome
- **Primary Key**: bridge_lo_id
- **Foreign Keys**: assessment_grade_id, learning_outcome_id
- **Attributes**: weight, contribution_percentage
- **Estimated Rows**: 100,000 - 500,000 (multiple LOs per assessment grade)
- **Columns**: 5 (1 PK + 2 FK + 2 attributes)
- **Estimated Size**: ~4-20 MB (assuming 40 bytes per row)

**Fact_AssessmentGrade_Bridge_PO**
- **Purpose**: Bridge table for many-to-many relationship between Fact_AssessmentGrade and Dim_ProgramOutcome
- **Primary Key**: bridge_po_id
- **Foreign Keys**: assessment_grade_id, program_outcome_id
- **Attributes**: weight, contribution_percentage
- **Estimated Rows**: 50,000 - 250,000 (multiple POs per assessment grade)
- **Columns**: 5 (1 PK + 2 FK + 2 attributes)
- **Estimated Size**: ~2-10 MB (assuming 40 bytes per row)

## Schema Discussion

### Star Schema vs Snowflake Schema

**This is a Star Schema with Bridge Tables.**

The schema follows a star schema design with the following characteristics:

1. **Single Central Fact Table**: `Fact_AssessmentGrade` is the only fact table, representing the core business process (student assessment grading).

2. **Fully Denormalized Dimensions**: All dimension tables are flat and fully denormalized:
   - No dimension-to-dimension foreign keys
   - Department information stored as string attribute (`department_name`) in relevant dimensions
   - Teacher information denormalized into `Dim_Course` (teacher_name, teacher_email)
   - Course attributes denormalized into `Dim_LearningOutcome` (course_code, course_name)

3. **Bridge Tables for Many-to-Many Relationships**: Bridge tables are used to handle many-to-many relationships:
   - `Fact_AssessmentGrade_Bridge_LO`: Handles many-to-many between fact table and Learning Outcomes
   - `Fact_AssessmentGrade_Bridge_PO`: Handles many-to-many between fact table and Program Outcomes
   - This is standard Kimball methodology for handling many-to-many relationships in star schemas
   - Preserves the fact table grain while allowing multiple LO/PO relationships per assessment grade

4. **No Snowflake Structure**: There are no normalized hierarchies or dimension-to-dimension relationships that would create a snowflake structure.

5. **Star-Shaped Structure**: The schema forms a star shape with the fact table at the center, core dimensions connected directly, and LO/PO dimensions connected via bridge tables.

### Normalized vs Denormalized

**This schema is Denormalized.**

The schema is intentionally denormalized for analytical (OLAP) purposes:

1. **Dimension Denormalization**:
   - Department is not a separate dimension but stored as `department_name` string in multiple dimensions
   - Teacher attributes are denormalized into `Dim_Course` instead of maintaining a separate `Dim_Teacher` dimension
   - Course attributes are denormalized into `Dim_LearningOutcome` for direct analysis

2. **Benefits of Denormalization**:
   - **Query Performance**: Fewer joins required for analytical queries
   - **Simplified Reporting**: Direct access to related attributes without complex joins
   - **OLAP Optimization**: Optimized for read-heavy analytical workloads
   - **Star Join Efficiency**: Enables efficient star join operations in data warehouse environments

3. **Trade-offs**:
   - **Storage**: Slightly increased storage due to data duplication
   - **Data Consistency**: Requires ETL processes to maintain denormalized data consistency
   - **Update Complexity**: Changes to denormalized attributes require updates across multiple dimension rows

### Schema Design Rationale

1. **Fact Table Grain**: The grain "one student's score for one assessment" ensures each row represents a single measurement event, enabling accurate aggregation and analysis.

2. **Bridge Tables for Many-to-Many Relationships**: Bridge tables are necessary because:
   - One assessment can map to multiple Learning Outcomes (OLTP: Assessment → LO many-to-many through AssessmentLO)
   - One assessment grade can contribute to multiple Program Outcomes (through LO → PO chain)
   - Bridge tables preserve the many-to-many relationship while maintaining the fact table grain
   - Each bridge table row represents one assessment grade's relationship to one LO/PO
   - Weight and contribution_percentage stored in bridge tables for accurate aggregation

3. **Time Dimension**: The time dimension supports temporal analysis by semester, academic year, and specific dates, enabling trend analysis and time-based reporting.

4. **Department as Attribute**: Department is stored as a string attribute rather than a separate dimension because:
   - Department is a descriptive attribute, not a separate business entity
   - Eliminates unnecessary joins for department-based analysis
   - Maintains star schema structure without additional dimensions

5. **Bridge Tables Follow Kimball Methodology**: Bridge tables are standard practice in dimensional modeling for many-to-many relationships:
   - They allow the fact table to maintain its grain
   - They preserve all relationships without data loss
   - They enable accurate analysis by LO/PO through proper joins
   - They are the recommended approach when many-to-many relationships exist

## Summary

- **Schema Type**: Star Schema with Bridge Tables (Kimball methodology for many-to-many relationships)
- **Normalization Level**: Denormalized (for OLAP optimization)
- **Total Tables**: 9 (1 fact + 6 dimensions + 2 bridge tables)
- **Total Estimated Size**: ~10-45 MB (depending on data volume)
- **Optimized For**: Analytical reporting, OLAP queries, data warehouse operations
- **Structure**: Star shape with fact table at center, core dimensions connected directly, LO/PO dimensions connected via bridge tables
- **Key Feature**: Preserves many-to-many relationships (Assessment → LO, Assessment → PO) without data loss

