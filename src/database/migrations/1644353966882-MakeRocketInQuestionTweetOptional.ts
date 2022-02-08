import {MigrationInterface, QueryRunner} from "typeorm";

export class MakeRocketInQuestionTweetOptional1644353966882 implements MigrationInterface {
    name = 'MakeRocketInQuestionTweetOptional1644353966882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "use_rocket_emoji_in_questions" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "use_rocket_emoji_in_questions"`);
    }

}
