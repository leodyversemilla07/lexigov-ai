import { PartialType } from '@nestjs/mapped-types';
import { CreateComplianceDto } from './create-compliance.dto';

export class UpdateComplianceDto extends PartialType(CreateComplianceDto) {}
