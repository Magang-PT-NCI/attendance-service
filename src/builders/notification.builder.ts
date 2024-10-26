import { NotificationResBody } from '../dto/notification.dto';
import { NotificationBuilderItem } from '../interfaces/notification.interfaces';

export class NotificationBuilder {
  private readonly notifications: NotificationBuilderItem[];

  private nik: string;
  private name: string;
  private message: string;
  private date: string;
  private file: string | null = null;
  private action_endpoint: string | null = null;
  private priority: number;

  public constructor(nik?: string, name?: string) {
    this.nik = nik;
    this.name = name;
    this.priority = 1;
    this.notifications = [];
  }

  public push() {
    this.notifications.push({
      nik: this.nik,
      name: this.name,
      message: this.message,
      date: this.date,
      file: this.file,
      action_endpoint: this.action_endpoint,
      priority: this.priority,
    });

    this.message = '';
    this.date = '';
    this.file = null;
    this.action_endpoint = null;
  }

  public getNotifications(): NotificationResBody[] {
    return this.notifications
      .sort((a, b) => a.priority - b.priority)
      .map((notificationItem) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { priority, ...notification } = notificationItem;
        return notification;
      });
  }

  public setPriority(priority: number): NotificationBuilder {
    this.priority = priority;
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
