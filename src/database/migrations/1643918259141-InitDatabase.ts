import {MigrationInterface, QueryRunner} from "typeorm";

export class InitDatabase1643918259141 implements MigrationInterface {
    name = 'InitDatabase1643918259141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "application_token" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "token" text NOT NULL, "redirect_to" text NOT NULL, "validator" text, "owner_id" integer NOT NULL, "application_id" integer NOT NULL, CONSTRAINT "PK_1e5d54602620099c1e7ccf7ae47" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "questionit_application" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "key" character varying(255) NOT NULL, "url" text NOT NULL DEFAULT '', "default_rights" bigint NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "owner_id" integer NOT NULL, CONSTRAINT "PK_aa09c49733e5cde7ad0a3e5906e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "token" ("id" SERIAL NOT NULL, "jti" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "open_ip" character varying(255) NOT NULL, "last_login_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "rights" bigint, "last_ip" character varying(255), "owner_id" integer NOT NULL, "app_id" integer NOT NULL, CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "i_token_jti_unique" ON "token" ("jti") `);
        await queryRunner.query(`CREATE TABLE "relationship" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "from_user_id" integer NOT NULL, "to_user_id" integer NOT NULL, CONSTRAINT "PK_67eb56a3f16da3d901a8ae446a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "push_message" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "endpoint" text NOT NULL, "content" jsonb NOT NULL, "target_user_id" integer NOT NULL, CONSTRAINT "PK_9625b6d1dafd797ed7ceeb0fee6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "block" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "owner_id" integer NOT NULL, "target_id" integer NOT NULL, CONSTRAINT "PK_d0925763efb591c2e2ffb267572" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "poll" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "emitter_ip" character varying(64), "options" jsonb, "owner_id" integer NOT NULL, "question_id" integer, CONSTRAINT "REL_64ffe03962960bba0ffb011aef" UNIQUE ("question_id"), CONSTRAINT "PK_03b5cf19a7f562b231c3458527e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "like" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "emitter_id" integer NOT NULL, "answer_id" integer NOT NULL, CONSTRAINT "PK_eff3e46d24d416b52a7e0ae4159" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "answer" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "owner_id" integer, "content" integer NOT NULL, "linked_image" text, "question_id" integer, CONSTRAINT "REL_c3d19a89541e4f0813f2fe0919" UNIQUE ("question_id"), CONSTRAINT "PK_9232db17b63fb1e94f97e5c224f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "question" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "content" text NOT NULL, "seen" boolean NOT NULL DEFAULT false, "muted" boolean NOT NULL DEFAULT false, "tweet_id" character varying(255), "question_of_the_day" text, "conversation_id" character varying(255) NOT NULL, "emitter_ip" character varying(255), "in_reply_to_question_id" integer NOT NULL, "private_owner_id" integer, "owner_id" integer, "receiver_id" integer, CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "seen" boolean NOT NULL DEFAULT false, "type" text NOT NULL, "related_to" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(64) NOT NULL, "twitter_id" character varying(255) NOT NULL, "twitter_oauth_token" character varying(255) NOT NULL, "twitter_oauth_secret" character varying(255) NOT NULL, "profile_picture" character varying(255), "banner_picture" character varying(255), "ask_me_message" text NOT NULL DEFAULT 'Ask me something!', "send_questions_to_twitter_by_default" boolean NOT NULL DEFAULT true, "allow_question_of_the_day" boolean NOT NULL DEFAULT true, "visible" boolean NOT NULL DEFAULT true, "blocked_words" text NOT NULL, "drop_questions_on_blocked_word" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()', "allow_anonymous_questions" boolean NOT NULL DEFAULT true, "safe_mode" boolean NOT NULL DEFAULT true, "pinned_question_id" integer, CONSTRAINT "REL_df11f479b2e5f5a8707c78e561" UNIQUE ("pinned_question_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "i_user_twitter_id_unique" ON "user" ("twitter_id") `);
        await queryRunner.query(`ALTER TABLE "application_token" ADD CONSTRAINT "FK_22bff875518ec7bec98ab3f557a" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_token" ADD CONSTRAINT "FK_2bb61f4f6eba9f885991740f389" FOREIGN KEY ("application_id") REFERENCES "questionit_application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questionit_application" ADD CONSTRAINT "FK_de95a735c0df3ed94d808b19a1a" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "token" ADD CONSTRAINT "FK_77fa31a311c711698a0b9443823" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "token" ADD CONSTRAINT "FK_1e87823e138fed9832239123ef8" FOREIGN KEY ("app_id") REFERENCES "questionit_application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "relationship" ADD CONSTRAINT "FK_ab01cb5295f0683f9b1f9d6cb89" FOREIGN KEY ("from_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "relationship" ADD CONSTRAINT "FK_2d5181526abe39707ddfdf6cdf2" FOREIGN KEY ("to_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "push_message" ADD CONSTRAINT "FK_b62c4b3b0948ac5e497e796c7c8" FOREIGN KEY ("target_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "block" ADD CONSTRAINT "FK_784276dc6ab5998edaf987f0e77" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "block" ADD CONSTRAINT "FK_4f49dc102727b496dab08d4eeb3" FOREIGN KEY ("target_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "poll" ADD CONSTRAINT "FK_dbd9813b7ec48607f5468bc492f" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "poll" ADD CONSTRAINT "FK_64ffe03962960bba0ffb011aefe" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_1d3b6a61e8a702f5e797b033e84" FOREIGN KEY ("emitter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_33162dd63ceb61754b8a7494a39" FOREIGN KEY ("answer_id") REFERENCES "answer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "answer" ADD CONSTRAINT "FK_676ac1f56a43bd80c5005eff351" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "answer" ADD CONSTRAINT "FK_c3d19a89541e4f0813f2fe09194" FOREIGN KEY ("question_id") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_de721431aab51f969eaa84845d1" FOREIGN KEY ("in_reply_to_question_id") REFERENCES "question"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_df3a2a76816b0d673b9b4baa7fa" FOREIGN KEY ("private_owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_a29d7a5fb28cb17c4aae7837dc4" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_1bae0854035193fbb563f71a5cc" FOREIGN KEY ("receiver_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_df11f479b2e5f5a8707c78e561e" FOREIGN KEY ("pinned_question_id") REFERENCES "question"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_df11f479b2e5f5a8707c78e561e"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8"`);
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_1bae0854035193fbb563f71a5cc"`);
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_a29d7a5fb28cb17c4aae7837dc4"`);
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_df3a2a76816b0d673b9b4baa7fa"`);
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_de721431aab51f969eaa84845d1"`);
        await queryRunner.query(`ALTER TABLE "answer" DROP CONSTRAINT "FK_c3d19a89541e4f0813f2fe09194"`);
        await queryRunner.query(`ALTER TABLE "answer" DROP CONSTRAINT "FK_676ac1f56a43bd80c5005eff351"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_33162dd63ceb61754b8a7494a39"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_1d3b6a61e8a702f5e797b033e84"`);
        await queryRunner.query(`ALTER TABLE "poll" DROP CONSTRAINT "FK_64ffe03962960bba0ffb011aefe"`);
        await queryRunner.query(`ALTER TABLE "poll" DROP CONSTRAINT "FK_dbd9813b7ec48607f5468bc492f"`);
        await queryRunner.query(`ALTER TABLE "block" DROP CONSTRAINT "FK_4f49dc102727b496dab08d4eeb3"`);
        await queryRunner.query(`ALTER TABLE "block" DROP CONSTRAINT "FK_784276dc6ab5998edaf987f0e77"`);
        await queryRunner.query(`ALTER TABLE "push_message" DROP CONSTRAINT "FK_b62c4b3b0948ac5e497e796c7c8"`);
        await queryRunner.query(`ALTER TABLE "relationship" DROP CONSTRAINT "FK_2d5181526abe39707ddfdf6cdf2"`);
        await queryRunner.query(`ALTER TABLE "relationship" DROP CONSTRAINT "FK_ab01cb5295f0683f9b1f9d6cb89"`);
        await queryRunner.query(`ALTER TABLE "token" DROP CONSTRAINT "FK_1e87823e138fed9832239123ef8"`);
        await queryRunner.query(`ALTER TABLE "token" DROP CONSTRAINT "FK_77fa31a311c711698a0b9443823"`);
        await queryRunner.query(`ALTER TABLE "questionit_application" DROP CONSTRAINT "FK_de95a735c0df3ed94d808b19a1a"`);
        await queryRunner.query(`ALTER TABLE "application_token" DROP CONSTRAINT "FK_2bb61f4f6eba9f885991740f389"`);
        await queryRunner.query(`ALTER TABLE "application_token" DROP CONSTRAINT "FK_22bff875518ec7bec98ab3f557a"`);
        await queryRunner.query(`DROP INDEX "public"."i_user_twitter_id_unique"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "question"`);
        await queryRunner.query(`DROP TABLE "answer"`);
        await queryRunner.query(`DROP TABLE "like"`);
        await queryRunner.query(`DROP TABLE "poll"`);
        await queryRunner.query(`DROP TABLE "block"`);
        await queryRunner.query(`DROP TABLE "push_message"`);
        await queryRunner.query(`DROP TABLE "relationship"`);
        await queryRunner.query(`DROP INDEX "public"."i_token_jti_unique"`);
        await queryRunner.query(`DROP TABLE "token"`);
        await queryRunner.query(`DROP TABLE "questionit_application"`);
        await queryRunner.query(`DROP TABLE "application_token"`);
    }

}
