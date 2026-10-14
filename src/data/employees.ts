// TODO: replace mock data with API responses
export type Gender = 'Male' | 'Female'
export type EmploymentType = 'Regular' | 'Contract' | 'Intern'

export type Employee = {
  code: string
  name: string
  designation: string
  service: string
  gender: Gender
  employmentType: EmploymentType
  unit: string | null
  mobile: boolean
  web: boolean
  travel: boolean
  faceEnrolled: boolean
  relieved: boolean
}

const emp = (
  code: string,
  name: string,
  designation: string,
  service: string,
  gender: Gender,
  extra: Partial<Employee> = {},
): Employee => ({
  code,
  name,
  designation,
  service,
  gender,
  employmentType: 'Regular',
  unit: null,
  mobile: true,
  web: false,
  travel: false,
  faceEnrolled: true,
  relieved: false,
  ...extra,
})

// Stable mock contact details derived from the employee
export function contactOf(e: Employee) {
  const first = e.name.split(' ')[0].toLowerCase()
  const n = Number(e.code.replace(/\D/g, '')) || 0
  return {
    username: first,
    email: `${first}@logface.in`,
    mobile: `9${String(n * 7919).padStart(9, '0').slice(-9)}`,
  }
}

export const employees: Employee[] = [
  emp('WL1001', 'Aarav Sharma', 'Team Lead', 'Engineering', 'Male', { web: true }),
  emp('WL1002', 'Ananya Iyer', 'UI/UX Designer', 'Engineering', 'Female'),
  emp('WL1003', 'Arjun Reddy', 'Backend Developer', 'Engineering', 'Male'),
  emp('WL1004', 'Deepika Nair', 'HR Executive', 'Human Resources', 'Female', { web: true }),
  emp('WL1005', 'Harish Kumar', 'Sales Executive', 'Sales & Marketing', 'Male', { travel: true }),
  emp('WL1006', 'Ishita Verma', 'Recruiter', 'Human Resources', 'Female', { employmentType: 'Contract' }),
  emp('WL1007', 'Karan Mehta', 'Frontend Developer', 'Engineering', 'Male'),
  emp('WL1008', 'Kavya Menon', 'QA Analyst', 'Engineering', 'Female'),
  emp('WL1009', 'Manoj Pillai', 'Accountant', 'Finance', 'Male'),
  emp('WL1010', 'Meera Joshi', 'Marketing Manager', 'Sales & Marketing', 'Female', { web: true }),
  emp('WL1011', 'Nikhil Gupta', 'Frontend Developer', 'Engineering', 'Male'),
  emp('WL1012', 'Pooja Patel', 'Business Analyst', 'Finance', 'Female'),
  emp('WL1013', 'Rahul Desai', 'Project Manager', 'Engineering', 'Male', { web: true }),
  emp('WL1014', 'Ritu Agarwal', 'Finance Manager', 'Finance', 'Female'),
  emp('WL1015', 'Rohan Kapoor', 'Backend Developer', 'Engineering', 'Male'),
  emp('WL1016', 'Sanjay Rao', 'Support Engineer', 'Engineering', 'Male', { employmentType: 'Contract' }),
  emp('WL1017', 'Sneha Kulkarni', 'Sales Executive', 'Sales & Marketing', 'Female', { travel: true }),
  emp('WL1018', 'Suresh Babu', 'QA Analyst', 'Engineering', 'Male', { employmentType: 'Contract' }),
  emp('WL1019', 'Tanvi Bhat', 'Frontend Developer', 'Engineering', 'Female', { employmentType: 'Intern' }),
  emp('WL1020', 'Varun Choudhary', 'Support Engineer', 'Engineering', 'Male', { employmentType: 'Contract' }),
  emp('WL1021', 'Vikram Singh', 'Sales Executive', 'Sales & Marketing', 'Male'),
]

// TODO: replace with the authenticated user from the login API
export const currentUser = employees.find((e) => e.code === 'WL1002') ?? employees[0]
