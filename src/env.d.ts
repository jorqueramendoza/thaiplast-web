/// <reference path="../.astro/types.d.ts" />
import type { D1Database, R2Bucket, Fetcher } from '@cloudflare/workers-types';

declare global {
namespace App {
  interface Bindings {
    CATALOG_DB: D1Database;
    PRODUCT_IMAGES: R2Bucket;
    ASSETS: Fetcher;
    ACCESS_TEAM_DOMAIN?: string;
    ACCESS_AUD?: string;
    ADMIN_EMAILS?: string;
    LOCAL_ADMIN_TOKEN?: string;
  }
  interface Locals {
    catalog: ReturnType<typeof import('./lib/catalog-model').createCatalog>;
    adminEmail?: string;
    catalogRevision?: number;
  }
}
}
