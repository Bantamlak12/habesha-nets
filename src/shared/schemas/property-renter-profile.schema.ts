export const PropertyRenterProfileSchema = {
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
    bio: {
      type: 'string',
      example:
        'I am a landloard in Los Angeles, California, offering a house for rent with a rental price of $144 - $1023, and prefers to be contacted via SMS.',
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
    budgetRange: {
      type: 'object',
      properties: {
        min: { type: 'number', example: 234 },
        max: { type: 'number', example: 1024 },
      },
    },
  },
};
