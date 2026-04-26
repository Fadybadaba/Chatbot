import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.jobCriteria.upsert({
    where: { jobTitle: 'Senior Full-Stack Developer' },
    update: {
      source: 'CV 1.pdf',
      criteria:
        'Reference criteria (seeded from CV 1):\n' +
        '- Experience: ~6 years full-stack engineering\n' +
        '- Must-have skills: Python, React, JavaScript\n' +
        '- Nice-to-have / infra: AWS, Docker, Git\n' +
        '- Education: Bachelor of Computer Science (GUC)\n',
    },
    create: {
      jobTitle: 'Senior Full-Stack Developer',
      source: 'CV 1.pdf',
      criteria:
        'Reference criteria (seeded from CV 1):\n' +
        '- Experience: ~6 years full-stack engineering\n' +
        '- Must-have skills: Python, React, JavaScript\n' +
        '- Nice-to-have / infra: AWS, Docker, Git\n' +
        '- Education: Bachelor of Computer Science (GUC)\n',
    },
  });

  await prisma.jobCriteria.upsert({
    where: { jobTitle: 'Talent Acquisition Lead (HR)' },
    update: {
      source: 'CV 2.pdf',
      criteria:
        'Reference criteria (seeded from CV 2):\n' +
        '- Experience: ~5 years HR / recruitment (HRBP)\n' +
        '- Tools: LinkedIn Recruiter\n' +
        '- Payroll exposure (200+ employees)\n' +
        '- Certification: PHRi\n' +
        '- Skills: Strategic Hiring, Employee Relations\n',
    },
    create: {
      jobTitle: 'Talent Acquisition Lead (HR)',
      source: 'CV 2.pdf',
      criteria:
        'Reference criteria (seeded from CV 2):\n' +
        '- Experience: ~5 years HR / recruitment (HRBP)\n' +
        '- Tools: LinkedIn Recruiter\n' +
        '- Payroll exposure (200+ employees)\n' +
        '- Certification: PHRi\n' +
        '- Skills: Strategic Hiring, Employee Relations\n',
    },
  });

  await prisma.jobCriteria.upsert({
    where: { jobTitle: 'Senior Financial Analyst' },
    update: {
      source: 'CV 3.pdf',
      criteria:
        'Reference criteria (seeded from CV 3):\n' +
        '- Experience: ~10 years FP&A / finance management\n' +
        '- Systems: Oracle ERP (reporting/budgeting), SAP\n' +
        '- Audit + tax compliance exposure\n' +
        '- Certification: CMA\n' +
        '- Skills: Financial Modeling, Strategic Planning\n',
    },
    create: {
      jobTitle: 'Senior Financial Analyst',
      source: 'CV 3.pdf',
      criteria:
        'Reference criteria (seeded from CV 3):\n' +
        '- Experience: ~10 years FP&A / finance management\n' +
        '- Systems: Oracle ERP (reporting/budgeting), SAP\n' +
        '- Audit + tax compliance exposure\n' +
        '- Certification: CMA\n' +
        '- Skills: Financial Modeling, Strategic Planning\n',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    await prisma.$disconnect();
    throw e;
  });

