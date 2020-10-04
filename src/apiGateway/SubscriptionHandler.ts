import ApiGatewayWebSockets from "./ApiGatewayWebSockets";
import ObjectStore from "../objectStore/ObjectStore";

export type CacheObject = Subscription | SubscriberMap;

export enum SubscriberType {
  WebSocket = "WebSocket",
  PushNotification = "PushNotification",
}

const GONE_EXCEPTION_STATUS_CODE = 410;

export type Subscriber = WebSocketSubscriber | PushNotificationSubscriber;

export class WebSocketSubscriber {
  readonly type = SubscriberType.WebSocket;
  readonly id: string;
  readonly endpoint: string;

  constructor(id: string, endpoint: string) {
    this.id = id;
    this.endpoint = endpoint;
  }
}

export class PushNotificationSubscriber {
  readonly type = SubscriberType.PushNotification;
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }
}

export class Subscription {
  cacheName = "Subscription";
  toThingId: string;
  subscribers = new Array<Subscriber>();

  constructor(thingId: string) {
    this.toThingId = thingId;
  }
}

export class SubscriberMap {
  cacheName = "SubscriberMap";
  subscriberId: string;
  thingId: string;

  constructor(subscriberId: string, thingId: string) {
    this.subscriberId = subscriberId;
    this.thingId = thingId;
  }
}

export default class SubscriptionHandler {
  private readonly subscriptionStore: ObjectStore<CacheObject>;

  constructor(store: ObjectStore<CacheObject>) {
    this.subscriptionStore = store;
  }

  async getSubscriptionForThing(id: string): Promise<Subscription | undefined> {
    return this.subscriptionStore.get(id) as any;
  }

  async getSubscriberMapForSubscriber(
    id: string
  ): Promise<SubscriberMap | undefined> {
    return this.subscriptionStore.get(id) as any;
  }

  async subscribe(thingId: string, subscriber: Subscriber) {
    let subscription = await this.getSubscriptionForThing(thingId);
    if (!subscription) {
      subscription = new Subscription(thingId);
    }
    subscription.subscribers.push(subscriber);

    await this.subscriptionStore.put(thingId, subscription);
    await this.subscriptionStore.put(
      subscriber.id,
      new SubscriberMap(subscriber.id, thingId)
    );
  }

  async unsubscribe(subscriberId: string) {
    const subscriberMap = await this.getSubscriberMapForSubscriber(
      subscriberId
    );

    if (subscriberMap) {
      const thingId = subscriberMap.thingId;
      const subscription = await this.getSubscriptionForThing(thingId);
      if (subscription) {
        subscription.subscribers = subscription.subscribers.splice(
          subscription.subscribers.findIndex(
            (subscriber) => subscriber.id === thingId
          ),
          1
        );
        if (subscription.subscribers.length === 0) {
          await this.subscriptionStore.delete(thingId);
        } else {
          await this.subscriptionStore.put(thingId, subscription);
        }
      }
      await this.subscriptionStore.delete(subscriberId);
    }
  }

  async sendMessageToSubscribers(thingId: string, message: any): Promise<any> {
    const subscription = await this.getSubscriptionForThing(thingId);

    if (subscription) {
      const promises = subscription.subscribers.map(async (subscriber) => {
        if (subscriber instanceof WebSocketSubscriber) {
          subscriber.endpoint;
        }
        switch (subscriber.type) {
          case SubscriberType.WebSocket: {
            return ApiGatewayWebSockets.sendWebSocketMessage(
              subscriber.id,
              subscriber.endpoint,
              JSON.stringify(message)
            ).catch((error) => {
              if (
                error.errno === "ECONNREFUSED" ||
                error.statusCode === GONE_EXCEPTION_STATUS_CODE
              ) {
                return this.unsubscribe(subscriber.id);
              }
              throw error;
            });
          }
          case SubscriberType.PushNotification: {
            return Promise.reject("PushNotifications not implemented yet");
          }
        }
      });

      return Promise.all(promises);
    }
  }
}
