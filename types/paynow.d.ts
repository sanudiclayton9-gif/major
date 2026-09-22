declare module "paynow" {
  export class Paynow {
    constructor(id: string, key: string);
    resultUrl: string;
    returnUrl: string;
    createPayment(reference: string, email: string): Payment;
    sendMobile(payment: Payment, phone: string, method: string): Promise<MobileResponse>;
    pollTransaction(pollUrl: string): Promise<PollResult>;
  }

  export class Payment {
    add(name: string, amount: number): void;
  }

  export interface MobileResponse {
    success: boolean;
    error?: string;
    pollUrl?: string;
    instructions?: string;
  }

  export interface PollResult {
    paid(): boolean;
    status?: string;
  }

  export default Paynow;
}
