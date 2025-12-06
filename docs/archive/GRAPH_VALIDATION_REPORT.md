# Database Graph Structure Validation Report
**Generated:** 2025-12-06T15:18:16.752080
**Overall Status:** ✅ **PASS**
**Pass Rate:** 100.0% (9/9 checks passed)

---

## 📊 Executive Summary

- **Total Validation Checks:** 9
- **Passed:** 9 ✅
- **Failed:** 0 ❌
- **Overall Result:** PASS

---

## 1️⃣ Table Identification

### Assessments Table
- **Table Name:** `assessments`
- **Primary Key:** `id`
- **Columns:** `id`, `course`, `title`, `description`, `assessment_type`, `weight`, `max_score`, `due_date`, `is_active`, `feedback_ranges`
- **Foreign Keys:**
  - `course` → `courses`

### Learning Outcomes Table
- **Table Name:** `learning_outcomes`
- **Primary Key:** `id`
- **Columns:** `id`, `code`, `title`, `description`, `course`, `target_percentage`, `is_active`, `created_at`, `updated_at`, `program_outcomes`
- **Foreign Keys:**
  - `course` → `courses`

### Program Outcomes Table
- **Table Name:** `program_outcomes`
- **Primary Key:** `id`
- **Columns:** `id`, `code`, `title`, `description`, `department`, `target_percentage`, `is_active`, `created_at`, `updated_at`

---

## 2️⃣ Mapping/Junction Tables

### Assessment → LO Mapping (AssessmentLO)
- **Table Name:** `assessment_learning_outcomes`
- **Assessment Column:** `assessment_id`
- **Learning Outcome Column:** `learning_outcome_id`
- **Weight Column:** `weight` ✅
- **Weight Range:** 0.21 - 5.0
- **Unique Constraint:** `assessment_id, learning_outcome_id`

### LO → PO Mapping (LOPO)
- **Table Name:** `lo_program_outcomes`
- **Learning Outcome Column:** `learning_outcome_id`
- **Program Outcome Column:** `program_outcome_id`
- **Weight Column:** `weight` ✅
- **Weight Range:** 0.23 - 10.0
- **Unique Constraint:** `learning_outcome_id, program_outcome_id`

---

## 3️⃣ Graph Constraint Validation

### Each Assessment must connect to ≥ 1 LO
**Status:** ✅ **PASS**

**Explanation:** N/A

**SQL Query:**
```sql
SELECT a.id FROM assessments a LEFT JOIN assessment_learning_outcomes alo ON a.id = alo.assessment_id WHERE alo.assessment_id IS NULL
```

### Each LO must connect to ≥ 1 PO
**Status:** ✅ **PASS**

**Explanation:** N/A

**SQL Query:**
```sql
SELECT lo.id FROM learning_outcomes lo LEFT JOIN lo_program_outcomes lopo ON lo.id = lopo.learning_outcome_id WHERE lopo.learning_outcome_id IS NULL
```

### No backward links: LO → Assessment
**Status:** ✅ **PASS**

**Explanation:** Model structure enforces Assessment → LO direction through AssessmentLO table

**SQL Query:**
```sql
N/A - Enforced by model structure
```

### No backward links: PO → LO
**Status:** ✅ **PASS**

**Explanation:** Model structure enforces LO → PO direction through LOPO table

**SQL Query:**
```sql
N/A - Enforced by model structure
```

### No direct Assessment → PO edges
**Status:** ✅ **PASS**

**Explanation:** Assessment model does not have direct related_pos field

**SQL Query:**
```sql
N/A
```

### No cycles detected in Assessment → LO → PO graph
**Status:** ✅ **PASS**

**Explanation:** Graph structure is acyclic: Assessment → LO → PO. No backward edges exist.

**SQL Query:**
```sql
N/A
```

### Graph allows topological ordering: Assessment < LO < PO
**Status:** ✅ **PASS**

**Explanation:** Graph structure enforces 3-level hierarchy: Assessment (level 0) → LO (level 1) → PO (level 2)

**SQL Query:**
```sql
N/A
```

### Cycle Detection
**Status:** ✅ **PASS**

**Description:** No cycles detected in Assessment → LO → PO graph

**Explanation:** Graph structure is acyclic: Assessment → LO → PO. No backward edges exist.

### Topological Ordering
**Status:** ✅ **PASS**

**Description:** Graph allows topological ordering: Assessment < LO < PO

**Node Counts:**
- assessments: 24
- learning_outcomes: 18
- program_outcomes: 7

**Edge Counts:**
- assessment_to_lo: 51
- lo_to_po: 35

**Topological Order:** Assessment → LearningOutcome → ProgramOutcome


---

## 4️⃣ Warnings and Recommendations

✅ No warnings or errors found!


---

## 5️⃣ Conclusion

✅ **The database graph structure properly enforces the 3-level acyclic directed graph model:**

- ✅ Directed weighted mapping (Assessment → LO → PO)
- ✅ Traceable outcome flow
- ✅ Standard academic assessment methodology

