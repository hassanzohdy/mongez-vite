import { UserConfig } from "vite";

export type MongezViteOptions = {
  /**
   * Production Base Url
   *
   * @default undefined
   */
  baseUrl?: string;
  /**
   * Environment Base Url Key that can be used to get the base
   * url from the environment variables in build mode
   *
   * @default PUBLIC_URL
   */
  envBaseUrlKey?: string;
  /**
   * Production Env Name
   * i.e production | build
   *
   * @default automatically will be detected
   */
  productionEnvName?: string;
  /**
   * Prefix for environment variables in html
   *
   * @default __ (Double underscores)
   */
  htmlEnvPrefix?: string;
  /**
   * Suffix for environment variables in html
   *
   * @default __ (Double underscores)
   */
  htmlEnvSuffix?: string;
  /**
   * Automatically open the browser
   *
   * @default true
   */
  autoOpenBrowser?: boolean;
  /**
   * Automatically resolve tsconfig paths to vite
   */
  tsconfigAlias?: boolean;
  /**
   * Auto link tsconfig paths to vite
   *
   * @default true
   */
  linkTsconfigPaths?: boolean;
  /**
   * optimizeDeps options
   * By default Mongez will try to  optimize the dependencies for the following files:
   * - index.html
   * - ./src/apps/**\/provider.ts
   */
  optimizeDeps?: UserConfig["optimizeDeps"];
  /**
   * Auto compress the build files
   *
   * @default true
   */
  compressBuild?: boolean;
  /**
   * Compressed file name
   *
   * @default build.zip
   */
  compressedFileName?: string;
  /**
   * Determine whether to generate .htaccess file for build
   *
   * @default true
   */
  htaccess?: boolean;
  /**
   * Pre Render options
   * This will generate a prerender.php file in the build directory
   * It requires a pre render service url to work
   */
  preRender?: {
    /**
     * Crawlers to prerender
     *
     * @default Google-Site-Verification|Googlebot|facebook|crawl|WhatsApp|bot|Slack|Twitter|bot
     */
    crawlers?: string;
    /**
     * Pre render service url
     *
     * @default https://render.mentoor.io
     */
    url?: string;
    /**
     * Delay before prerendering in milliseconds
     *
     * @default 5000
     */
    delay?: number;
    /**
     * Wether to getting a fresh content each time on crawling the url
     *
     * @default false
     */
    refresh?: boolean;
  };
};
