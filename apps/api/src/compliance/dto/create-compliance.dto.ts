import { IsString } from "class-validator";

export class CreateComplianceDto {
    @IsString()
    draftId!: string;
}
