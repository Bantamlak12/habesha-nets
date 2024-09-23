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
    address: {
      type: 'object',
      properties: {
        streetAddress: { type: 'string', example: '1234 Main St' },
        secondaryAddress: {
          type: 'string',
          example: 'Apt 101, Suite 3B, Unit 2',
        },
        city: { type: 'string', example: 'Los Angeles' },
        state: { type: 'string', example: 'California' },
        country: { type: 'string', example: 'USA' },
        zipcode: { type: 'string', example: '60601' },
      },
      zipcode: { type: 'string', example: '60601' },
    },
    bio: {
      type: 'string',
      example:
        'ABC is an innovative tech firm revolutionizing the AI industry with cutting-edge solutions.',
    },
  },
};
