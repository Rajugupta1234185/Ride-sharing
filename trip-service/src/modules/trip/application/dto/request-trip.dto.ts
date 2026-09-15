import { IsNumber, IsOptional } from 'class-validator';

export class RequestTripDto {
  @IsNumber() pickupLat!: number;
  @IsNumber() pickupLng!: number;
  @IsNumber() dropoffLat!: number;
  @IsNumber() dropoffLng!: number;
  @IsOptional() @IsNumber() fareEstimate?: number;
}