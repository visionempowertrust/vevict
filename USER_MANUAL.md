# VICT Site User Manual

## 1. Purpose of the Site

The VICT site is used to manage Computational Thinking learning resources, registrations, assessment question banks, assessment entry, and assessment dashboards for the Vision Empower VICT program.

The usual workflow is:

1. Review learning outcomes.
2. Review games and question banks.
3. Register schools, facilitators, and students.
4. Enter assessment observations for students.
5. Review assessment summaries and analysis in the dashboard.

## 2. Home Page

Open `index.html` to access the main site navigation.

The home page is grouped into two sections:

- About VICT Program: Outcomes, Games, FAQs.
- Monitoring and Evaluation: Registrations, Question Bank, Assessment Entry, Assessment Dashboard.

Use the Home button on each page to return to the home page.

## 3. Outcomes Page

Use the Outcomes page to view the master list of Computational Thinking outcomes and suboutcomes.

The page includes:

- CT Outcomes: Primary computational thinking outcomes.
- CT SubOutcomes: Subskills linked to each CT outcome.

These outcomes are used in the question bank and assessment entry pages.

## 4. Games Page

Use the Games page to view the VICT games master.

The page shows:

- Game details.
- Level.
- Primary CT skill.
- How the CT skill should be observed.
- How to Play information.
- Game levels, available through the game details action.

Games support the VICT learning model, but assessment entry is currently driven by the assessment question bank.

## 5. FAQs Page

Use the FAQs page to maintain frequently asked questions for the VICT program.

You can:

- Add FAQs.
- Edit FAQs.
- Delete FAQs.
- View the FAQ list.

## 6. Registrations Page

Use the Registrations page to manage the shared registration records.

Registration types:

- Schools.
- Facilitators.
- Students.

Choose the registration type from the dropdown at the top of the page.

### 6.1 School Registration

Use this section to add or maintain schools.

Fields include:

- State.
- District.
- School name.
- Address.
- School type.

Actions:

- Add school: Requires admin passcode.
- Edit school: Does not require passcode.
- Delete school: Requires admin passcode.
- Download School XLS: Downloads a blank template.
- Upload School XLS: Requires admin passcode.

### 6.2 Facilitator Registration

Use this section to add facilitators.

Fields include:

- States.
- First name.
- Last name.
- Email ID.
- Phone numbers.
- Designation.
- Qualification.
- Special Educator.
- Educator.

A facilitator can be assigned to more than one state.

### 6.3 Student Registration

Use this section to add students.

Fields include:

- State.
- District.
- School.
- Student ID.
- Name.
- Gender.
- Grade.
- Board of Education.
- Vision level.
- Regional Language.
- Disability and Braille-related fields.
- Computer and math-on-computer fields.

Actions:

- Add student: Requires admin passcode.
- Edit student: Does not require passcode.
- Delete student: Requires admin passcode.
- Download Student XLS: Downloads a blank template.
- Upload Student XLS: Requires admin passcode.

The student table is paginated. Use Previous and Next to move through large student lists.

Important: Grade must be a number from 1 to 10.

## 7. Assessment Question Bank

Use the Assessment Question Bank page to create question bank sets and maintain questions.

### 7.1 Create a Question Bank

Click Create Question Bank.

Enter:

- Question bank name.

New question banks are created in English by default.

### 7.2 View a Question Bank

Click the question bank name in the table.

The details section shows questions grouped by level and CT outcome.

### 7.3 Add Questions

Only English question banks allow adding questions.

Click Add Question for an English question bank.

For each question, enter:

- Primary Outcome.
- Question level.
- Question order.
- Total marks.
- Question text.
- Optional picture.
- Correct answer.

Question edits and deletes require the question-bank admin passcode.

## 8. Assessment Entry

Use Assessment Entry to record one student assessment.

Read the Note to the Assessors section before beginning.

### 8.1 Student Details

Select:

- State.
- School.
- Grade.
- Student Name.
- Assessment Date.
- Facilitator.

Assessment Date cannot be a future date.

If only one facilitator is available for the selected state, the facilitator is preselected.

### 8.2 Assessment Details

Select the assessment level:

- Level 1.
- Level 2.
- Level 3.

Questions for that level are shown grouped under CT outcomes.

For each question, select marks:

- 0.
- 0.25.
- 0.5.
- 0.75.
- 1.

### 8.3 Subskill Observation Status

For each CT subskill, select one status:

- Tested and Observed.
- Tested and Not Observed.
- Not tested.

Each subskill status is mandatory.

The overall CT outcome rating is calculated automatically:

- 0 or 1 subskills marked Tested and Observed: Missing.
- 2 or 3 subskills marked Tested and Observed: Adequate.
- All 4 subskills marked Tested and Observed: Acquired.

### 8.4 Free Play

Free Play is shown for Level 2 and Level 3.

Mark it as:

- Satisfactory.
- Needs improvement.

### 8.5 Observations and Accuracy

Use Any other observations to write about the student's knowledge level, skills, confidence, speed, and any other notable observations.

Accuracy score:

- High: Assessment was done in person by the facilitator.
- Low: There was guess work or the assessor is not sure about the scores.

### 8.6 Preview and Save

Use Preview assessment to review the entry.

When saving, the site shows a confirmation preview. Confirm to submit.

After successful submission, a popup confirms that the assessment was submitted successfully.

If there is an error, the entered data is preserved as a draft.

## 9. Assessment Dashboard

Use the Assessment Dashboard to review assessment data.

### 9.1 Assessment Summary

The summary shows:

- Number of assessments.
- Number of students.
- Average score.
- Student-level rows.

Use Download Full History CSV to export all assessment entry history for offline analysis.

Click Show to view full assessment details for a student.

### 9.2 Assessment Analysis

Choose an analysis level:

- Student Level.
- School Level.
- State Level.
- VE Level.

Student Level:

- Select State, District, School, and Student.
- View all assessments for that student in descending date order.
- Open details using Show.
- If multiple assessments exist, view progress over time by CT outcome.

School Level:

- Select State, District, and School.
- View CT outcome ratings by level.
- Counts use only each student's latest completed assessment.

State Level:

- Select State.
- View summary of schools and students assessed.
- View CT outcome ratings by school and level.
- Counts use only each student's latest completed assessment.

VE Level:

- View overall number of students assessed.
- View number of schools.
- View number of states.
- View CT outcome rating counts.

## 10. Language Dropdown

The site has a language dropdown at the top for regional-language rendering.

Available languages include:

- English.
- Hindi.
- Tamil.
- Marathi.
- Kannada.
- Gujarathi.
- Telugu.
- Malayalam.
- Odiya.
- Bengali.
- Assamese.

## 11. Admin Passcode Protected Actions

Some actions require a passcode.

Protected actions include:

- School upload from XLS.
- School add.
- School delete.
- Student upload from XLS.
- Student add.
- Student delete.
- Question edit.
- Question delete.
- Updating an existing question.

Editing existing school and student rows does not require a passcode.

## 12. Good Practice Checklist

Before assessment:

- Ensure schools, facilitators, and students are registered.
- Ensure the question bank has questions for the required level.
- Prepare all required tactile materials.
- Read the Note to the Assessors.

During assessment:

- Do not teach during assessment.
- Keep the student relaxed.
- Mark question scores carefully.
- Mark every subskill status.
- Write detailed observations.

After assessment:

- Preview the entry.
- Confirm and save.
- Review the dashboard for student progress.
- Download CSV if offline analysis is needed.
