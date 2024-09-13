import {
  registerDecorator,
  ValidatorOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class EmailOrPhoneConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as any;
    const hasEmail = !!obj.email;
    const hasPhoneNumber = !!obj.phoneNumber;

    return (hasEmail || hasPhoneNumber) && !(hasEmail && hasPhoneNumber);
  }

  defaultMessage(args: ValidationArguments) {
    const obj = args.object as any;
    const hasEmail = !!obj.email;
    const hasPhoneNumber = !!obj.phoneNumber;

    if (!hasEmail && !hasPhoneNumber) {
      return 'Either email or phone number must be provided.';
    }

    if (hasEmail && hasPhoneNumber) {
      return 'You must provide either an email or phone number, but not both.';
    }

    return '';
  }
}

export function IsEmailOrPhone(validationOptions?: ValidatorOptions) {
  return function (constructor: new (...args: any[]) => any) {
    registerDecorator({
      name: 'isEmailOrPhone',
      target: constructor,
      propertyName: '',
      options: validationOptions,
      validator: EmailOrPhoneConstraint,
    });
  };
}
