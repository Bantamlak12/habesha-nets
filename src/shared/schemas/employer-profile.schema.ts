export const employerProfileSchema = {
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
    companyName: { type: 'string', example: 'ABC Company' },
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
    description: {
      type: 'string',
      example:
        'ABC is an innovative tech firm revolutionizing the AI industry with cutting-edge solutions.',
    },
  },
};
