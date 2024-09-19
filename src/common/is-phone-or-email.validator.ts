import {
  registerDecorator,
  ValidatorOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isEmail,
} from 'class-validator';

// Regular expression for phone number validation (international format)
const phoneNumberRegex = /^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

@ValidatorConstraint({ async: false })
class EmailOrPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as any;

    if (typeof value !== 'string') {
      return false;
    }

    const isEmailValid = isEmail(value);
    const isPhoneNumberValid = phoneNumberRegex.test(value);

    // Assign the value to the corresponding field
    if (isEmailValid) {
      obj.email = value;
      obj.phoneNumber = undefined;
    } else if (isPhoneNumberValid) {
      obj.phoneNumber = value;
      obj.email = undefined;
    }

    return isEmailValid || isPhoneNumberValid;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Please provide either a valid email or phone number';
  }
}

export function IsEmailOrPhone(validationOptions?: ValidatorOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEmailOrPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: EmailOrPhoneConstraint,
    });
  };
}
