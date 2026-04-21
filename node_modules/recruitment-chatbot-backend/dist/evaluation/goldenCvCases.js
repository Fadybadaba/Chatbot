"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOLDEN_CV_CASES = void 0;
exports.GOLDEN_CV_CASES = [
    {
        id: 'dev-approve-full',
        jobTitle: 'Senior Full-Stack Developer',
        cvText: 'Jane Doe — jane@example.com\n6 years experience building web apps.\nStrong Python and React. AWS and Docker in production.',
        expectedApproved: true,
        tags: ['developer', 'happy-path'],
    },
    {
        id: 'dev-reject-low-years',
        jobTitle: 'Senior Full-Stack Developer',
        cvText: '3 years experience. Python and React developer.\nBuilt internal tools.',
        expectedApproved: false,
        tags: ['developer', 'experience'],
    },
    {
        id: 'dev-reject-no-python',
        jobTitle: 'Senior Full-Stack Developer',
        cvText: '8 years experience with Java and React enterprise systems.\nBackend stack: JVM only.',
        expectedApproved: false,
        tags: ['developer', 'keyword'],
    },
    {
        id: 'dev-reject-no-react',
        jobTitle: 'Senior Full-Stack Developer',
        cvText: '7 years experience. Python backend engineer; Vue and Angular.\nMicroservices.',
        expectedApproved: false,
        tags: ['developer', 'keyword'],
    },
    {
        id: 'hr-approve',
        jobTitle: 'Talent Acquisition Lead (HR)',
        cvText: 'Alex Kim — alex@example.com\nSHRM-CP certified. 5 years experience in talent acquisition and payroll systems.',
        expectedApproved: true,
        tags: ['hr', 'happy-path'],
    },
    {
        id: 'hr-reject-no-cert',
        jobTitle: 'Talent Acquisition Lead (HR)',
        cvText: '6 years HR generalist experience. Excel, onboarding, payroll.\nProfessional in HRIS implementations.',
        expectedApproved: false,
        tags: ['hr', 'credential'],
    },
    {
        id: 'hr-reject-low-exp',
        jobTitle: 'Talent Acquisition Lead (HR)',
        cvText: 'PHRi holder. 2 years recruiting coordinator experience.',
        expectedApproved: false,
        tags: ['hr', 'experience'],
    },
    {
        id: 'fin-approve',
        jobTitle: 'Senior Financial Analyst',
        cvText: 'CFA charterholder. 10 years experience in FP&A. SAP implementation lead.',
        expectedApproved: true,
        tags: ['finance', 'happy-path'],
    },
    {
        id: 'fin-reject-low-exp',
        jobTitle: 'Senior Financial Analyst',
        cvText: 'CMA certified. 5 years accounting experience. Oracle ERP user.',
        expectedApproved: false,
        tags: ['finance', 'experience'],
    },
    {
        id: 'fin-reject-no-cert',
        jobTitle: 'Senior Financial Analyst',
        cvText: '12 years financial analysis. Excel expert. SAP reporting.\nMBA finance; no charter credentials.',
        expectedApproved: false,
        tags: ['finance', 'credential'],
    },
    {
        id: 'dev-edge-min-years',
        jobTitle: 'Senior Full-Stack Developer',
        cvText: 'Exactly 5 years experience with Python and React in fintech.',
        expectedApproved: true,
        tags: ['developer', 'boundary'],
    },
    {
        id: 'hr-edge-phri-lower',
        jobTitle: 'Talent Acquisition Lead (HR)',
        cvText: 'PHRi certification. 4 years experience; LinkedIn Recruiter power user.',
        expectedApproved: true,
        tags: ['hr', 'boundary'],
    },
];
