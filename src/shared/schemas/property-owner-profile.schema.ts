export const PropertyOwnersProfileSchema = {
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
    zipcode: { type: 'string', example: '60601' },
    propertyType: { type: 'string', example: 'House' },
  },
};
