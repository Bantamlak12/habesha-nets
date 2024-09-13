export const babySitterFinder = {
  type: 'object',
  properties: {
    firstName: { type: 'string', example: 'Angelina' },
    lastName: { type: 'string', example: 'Smith' },
    email: { type: 'string', example: 'angelina@gmail.com', nullable: true },
    phoneNumber: {
      type: 'string',
      example: '+25424545475',
      nullable: true,
    },
    profilePicture: {
      type: 'string',
      format: 'binary',
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
    bio: {
      type: 'string',
      example:
        'Experienced baby sitter with over 5 years of expertise in providing exceptional child care. Skilled in managing children of all ages, from infants to school-age. Passionate about creating safe, fun, and engaging environments to foster child development. Available for part-time and full-time positions in the Los Angeles area.',
    },
  },
};
