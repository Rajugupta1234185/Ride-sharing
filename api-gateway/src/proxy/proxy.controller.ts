import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import express from 'express';
import { Request, Response} from "express";
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { firstValueFrom } from 'rxjs';

@Controller()
export class ProxyController {
  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {}

    private async forward(req: Request, res: Response, baseUrl: string) {
    const url = `${baseUrl}${req.url}`;
    console.log(`Proxying ${req.method} ${req.url} → ${url}`); 
    try {
        const response = await firstValueFrom(
        this.http.request({
            method: req.method as any,
            url,
            data: req.body,
            headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'x-user-id': (req as any).user?.sub,
            },
            timeout: 5000, // fail fast instead of hanging forever
        }),
        );
        res.status(response.status).json(response.data);
    } catch (err: any) {
        console.error('Proxy error:', err.message); // add this — you're currently swallowing details
        res.status(err.response?.status || 502).json(
        err.response?.data || { message: 'Upstream service error' },
        );
    }
    }

  // Public — no guard
  @All(['auth/*' , 'user/*'])
  proxyAuth(@Req() req: express.Request, @Res() res: express.Response) {
    return this.forward(req, res, this.config.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001'));
  }

  // Protected
  @UseGuards(JwtAuthGuard)
  @All(['trips/*', 'trips/'])
  proxyTrips(@Req() req: express.Request, @Res() res: express.Response) {
    return this.forward(req, res, this.config.get<string>('TRIP_SERVICE_URL', 'http://localhost:3002'));
  }

  @UseGuards(JwtAuthGuard)
  @All('payments/*')
  proxyPayments(@Req() req: express.Request, @Res() res: express.Response) {
    return this.forward(req, res, this.config.get<string>('PAYMENT_SERVICE_URL', 'http://localhost:3003'));
  }
}