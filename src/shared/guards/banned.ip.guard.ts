import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import fs from 'fs';
import config from '../config/config';
import fetch from 'node-fetch';

export interface IBannedIpsAndAccounts {
  ips: string[];
  accounts: number[];
  twitterIds: string[];
}

const TOR_BAN_LIST = 'https://check.torproject.org/torbulkexitlist';

@Injectable()
export class BannedIpGuard implements CanActivate {
  static bannedIps: Set<string> = new Set();
  static bannedAccounts: Set<number> = new Set();
  static bannedTorIps: Set<string> = new Set();
  static bannedTwitterIds: Set<string> = new Set();

  constructor() {}

  static refreshBannedIps() {
    const bannedIps = JSON.parse(fs.readFileSync(config.DATA.BANNED_IPS, 'utf-8')) as IBannedIpsAndAccounts;

    this.bannedIps = new Set(bannedIps.ips);
    this.bannedAccounts = new Set(bannedIps.accounts);
    this.bannedTwitterIds = new Set(bannedIps.twitterIds);
    this.refreshBannedTorIps().catch(() => {});
  }

  static async refreshBannedTorIps() {
    const data = await fetch(TOR_BAN_LIST).then(r => r.text());
    this.bannedTorIps = new Set<string>(data.split('\n').map(ip => ip.trim()));
  }

  static writeBannedIps() {
    fs.writeFileSync(config.DATA.BANNED_IPS, JSON.stringify({
      ips: [...this.bannedIps],
      accounts: [...this.bannedAccounts],
      twitterIds: [...this.bannedTwitterIds],
    }));
  }

  static isTorIpBanned(ip: string | string[]) {
    return typeof ip === 'string' ? this.bannedTorIps.has(ip) : ip.some(i => this.bannedTorIps.has(i));
  }

  static canAccessApi(ip: string | string[]) {
    return !this.isIpBanned(ip, false);
  }

  static isIpBanned(ip: string | string[], safeMode?: boolean) {
    if (safeMode && this.isTorIpBanned(ip)) {
      return true;
    }

    return typeof ip === 'string' ? this.bannedIps.has(ip) : ip.some(i => this.bannedIps.has(i));
  }

  static addIp(ip: string) {
    this.bannedIps.add(ip);
    this.writeBannedIps();
  }

  static removeIp(ip: string) {
    this.bannedIps.delete(ip);
    this.writeBannedIps();
  }

  static listIps() {
    return [...this.bannedIps];
  }

  static isUserAccountBanned(userId: number) {
   return this.bannedAccounts.has(userId);
  }

  static banUserAccount(userId: number) {
    this.bannedAccounts.add(userId);
    this.writeBannedIps();
  }

  static removeUserAccountBan(userId: number) {
    this.bannedAccounts.delete(userId);
    this.writeBannedIps();
  }

  static listBannedAccounts() {
    return [...this.bannedAccounts];
  }

  static isTwitterIdBanned(userId: string) {
    return this.bannedTwitterIds.has(userId);
  }

  static banTwitterId(userId: string) {
    this.bannedTwitterIds.add(userId);
    this.writeBannedIps();
  }

  static removeTwitterIdBan(userId: string) {
    this.bannedTwitterIds.delete(userId);
    this.writeBannedIps();
  }

  static listBannedTwitterIds() {
    return [...this.bannedTwitterIds];
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest() as Request;
    const ips = request.ips || request.ip || '';

    return BannedIpGuard.canAccessApi(ips);
  }
}

BannedIpGuard.refreshBannedIps();
