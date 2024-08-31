export const freelancerProfileSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', example: 'John' },
    lastName: { type: 'string', example: 'Doe' },
    email: { type: 'string', example: 'john12@gmail.com', nullable: true },
    phoneNumber: {
      type: 'string',
      example: '+25424545475',
      nullable: true,
    },
    profilePicture: {
      type: 'string',
      format: 'binary',
      description: 'Profile picture file',
    },
    preferredContactMethod: { type: 'string', example: 'SMS' },
    location: {
      type: 'object',
      properties: {
        city: { type: 'string', example: 'Los Angeles' },
        state: { type: 'string', example: 'California' },
        country: { type: 'string', example: 'USA' },
      },
    },
    profession: { type: 'string', example: 'Web Developer' },
    skills: {
      type: 'array',
      items: { type: 'string' },
      example: ['HTML', 'CSS', 'JavaScript'],
    },
    qualifications: {
      type: 'object',
      properties: {
        degrees: { type: 'string', example: 'BSc in Computer Science' },
        certifications: {
          type: 'string',
          example: 'Certified JavaScript Developer',
        },
        trainings: { type: 'string', example: 'Advanced React Trainig' },
      },
    },
    portfolioLinks: {
      type: 'array',
      items: { type: 'string' },
      example: ['http://portfolio1.com', 'http://portfolio2.com'],
    },
    portfolioFiles: {
      type: 'string',
      format: 'binary',
      description: 'portfolio images',
    },
    description: {
      type: 'string',
      example: 'A passionate web developer with 5 years of experience...',
    },
    experience: {
      type: 'object',
      properties: {
        position: { type: 'string', example: 'Software Engineer' },
        yearsOfExperience: { type: 'string', example: '3 years' },
        responsibilities: {
          type: 'string',
          example: ['Developed web applications', 'Led a team of developers'],
          company: { type: 'string', example: 'Tech Corp' },
          startDate: { type: 'string', example: '2020-01-01' },
          endDate: { type: 'string', example: '2023-01-01' },
        },
      },
    },
    availability: {
      type: 'object',
      properties: {
        days: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: ['Monday', 'Wednesday'],
        },
        hours: {
          type: 'string',
          example: '9 AM - 5 PM',
        },
      },
    },
    languages: {
      type: 'array',
      items: { type: 'string' },
      example: ['English', 'French'],
    },
    hourlyRate: { type: 'string', example: '3' },
  },
};
