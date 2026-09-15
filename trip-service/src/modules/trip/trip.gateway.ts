// trip.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class TripGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log('Client connected', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected', client.id);
  }

  // Client calls this right after connecting, passing their riderId
  @SubscribeMessage('join')
  handleJoin(client: Socket, riderId: string) {
    client.join(`rider:${riderId}`);
  }

  // Called from your Kafka consumer when trip.matched / trip.no_driver_found arrives
 // trip.gateway.ts
emitTripUpdate(riderId: string, trip: any) {
  if (!trip) {
    console.error('🚨 emitTripUpdate called with a NULL/undefined trip! riderId:', riderId);
    console.trace(); // prints the call stack — tells us exactly which caller did this
    return; // don't emit garbage to the rider
  }
  console.log(`📤 Emitting trip:update to room rider:${riderId}`, trip.status);
  this.server.to(`rider:${riderId}`).emit('trip:update', trip);
}

  emitDriverLocation( riderId : string, location : { driverId: string, lat:number,  lng:number}){
    console.log(" emitiing driver location to the riderId");
    this.server.to(`rider:${riderId}`).emit('driver:location', location );
  }
}