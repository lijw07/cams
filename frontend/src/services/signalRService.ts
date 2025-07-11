import * as signalR from '@microsoft/signalr';

import { env } from '../config/environment';
import { MigrationProgress } from '../types';

import { apiService } from './api';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = apiService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const hubUrl = `${env.api.baseUrl}/hubs/migration`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Handle connection events
    this.connection.onclose(async (error) => {
      console.warn('SignalR connection closed:', error);
      await this.handleReconnect();
    });

    this.connection.onreconnecting((error) => {
      console.warn('SignalR reconnecting:', error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.reconnectAttempts = 0;
    });

    try {
      await this.connection.start();
      console.log('SignalR connection established');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  async joinMigrationGroup(progressId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.connect();
    }

    try {
      await this.connection!.invoke('JoinMigrationGroup', progressId);
      console.log(`Joined migration group: ${progressId}`);
    } catch (error) {
      console.error('Failed to join migration group:', error);
      throw error;
    }
  }

  async leaveMigrationGroup(progressId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('LeaveMigrationGroup', progressId);
      console.log(`Left migration group: ${progressId}`);
    } catch (error) {
      console.error('Failed to leave migration group:', error);
    }
  }

  onProgressUpdate(callback: (progress: MigrationProgress) => void): void {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    this.connection.on('ProgressUpdate', callback);
  }

  offProgressUpdate(callback: (progress: MigrationProgress) => void): void {
    if (this.connection) {
      this.connection.off('ProgressUpdate', callback);
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    try {
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      await this.connect();
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      await this.handleReconnect();
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state || null;
  }
}

export const signalRService = new SignalRService();
export default signalRService;