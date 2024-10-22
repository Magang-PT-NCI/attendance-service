import { NotificationResBody } from '../dto/notification.dto';

export class NotificationBuilder {
  private readonly attendanceNotifications: NotificationResBody[];
  private readonly permitNotifications: NotificationResBody[];
  private readonly overtimeNotifications: NotificationResBody[];

  private nik: string;
  private name: string;
  private message: string;
  private date: string;
  private file: string | null = null;
  private action_endpoint: string | null = null;
  private level: 'attendance' | 'permit' | 'overtime';

  public constructor(nik?: string, name?: string) {
    this.nik = nik;
    this.name = name;
    this.level = 'attendance';
    this.attendanceNotifications = [];
    this.permitNotifications = [];
    this.overtimeNotifications = [];
  }

  public push() {
    const notification = {
      nik: this.nik,
      name: this.name,
      message: this.message,
      date: this.date,
      file: this.file,
      action_endpoint: this.action_endpoint,
    };

    switch (this.level) {
      case 'attendance':
        this.attendanceNotifications.push(notification);
        break;
      case 'permit':
        this.permitNotifications.push(notification);
        break;
      case 'overtime':
        this.overtimeNotifications.push(notification);
        break;
    }

    this.message = '';
    this.date = '';
    this.file = null;
    this.action_endpoint = null;
  }

  public getNotifications(): NotificationResBody[] {
    return [
      ...this.overtimeNotifications,
      ...this.permitNotifications,
      ...this.attendanceNotifications,
    ];
  }

  public setLevel(
    level: 'attendance' | 'permit' | 'overtime',
  ): NotificationBuilder {
    this.level = level;
    return this;
  }

  public setNik(nik: string): NotificationBuilder {
    this.nik = nik;
    return this;
  }

  public setName(name: string): NotificationBuilder {
    this.name = name;
    return this;
  }

  public setMessage(message: string): NotificationBuilder {
    this.message = message;
    return this;
  }

  public setDate(date: string): NotificationBuilder {
    this.date = date;
    return this;
  }

  public setFile(file: string): NotificationBuilder {
    this.file = file;
    return this;
  }

  public setActionEndpoint(actionEndpoint: string): NotificationBuilder {
    this.action_endpoint = actionEndpoint;
    return this;
  }
}
