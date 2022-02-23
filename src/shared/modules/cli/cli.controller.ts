import { Controller } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, Like } from 'typeorm';
import CliHelper, { CliListener } from 'interactive-cli-helper';
import { User } from '../../../database/entities/user.entity';
import { DayQuestion } from '../../../database/entities/day.question.entity';
import config from '../../config/config';

const helpMessage = CliHelper.formatHelp('QuestionIt.space server', {
  commands: {
    user: 'Manage registred users',
    'day-question': 'Manage day questions',
  },
});

const helper = new CliHelper({
  onNoMatch: rest => rest ? helpMessage : 'Command not found.'
});

@Controller()
export class CliModuleController {
  private currentUserId = 0;

  constructor(
    @InjectConnection() private db: Connection,
  ) {
    setTimeout(() => this.initCli(), 1500);
  }

  private initCli() {


    const helper = new CliHelper({
      onNoMatch: rest => rest ? helpMessage : 'Command not found.'
    });

    helper.onclose = () => {
      console.log('Goodbye.');
      process.exit(0);
    };

    // --- DEFINE SUBCOMMANDS HERE ---
    helper.command('user', this.getUserCli());
    helper.command('day-question', this.getDayQuestionCli());
    // --- SUBCOMMANDS END ---

    console.log('\nWelcome to QuestionIt API server CLI.');
    console.log(`To get help, type 'help'\n`);
    helper.listen();
  }

  private getUserCli() {
    const userRepository = this.db.getRepository(User);

    const cli = new CliListener(CliHelper.formatHelp(
      'user', {
        commands: {
          lookup: 'Lookup for users using name and slug as argument',
          delete: 'Delete a user matching the exact provided slug',
          search: 'Search for users using name and slug as argument, and print only name/slug/id',
          get: 'Get a single user matching the exact provided slug',
          switch: 'Define which user you want to use in this CLI for user-based interactions',
        },
        description: 'Manage registered users in QuestionIt.space\n',
      }
    ));

    cli.command('lookup', rest => {
      return userRepository.find({
        where: [{
          slug: Like('%' + rest + '%'),
        }, {
          name: Like('%' + rest + '%'),
        }],
        take: 10,
      });
    });

    cli.command('delete', async rest => {
      if (!rest) {
        return 'Please specify a user';
      }

      const user = await userRepository.findOne({ where: { slug: Like('%' + rest + '%') } });

      if (!user) {
        return 'User not found';
      }

      await userRepository.delete({ id: user.id });
      return 'User deleted.';
    });

    cli.command('search', async rest => {
      const results = await userRepository.find({
        where: [{
          slug: Like('%' + rest + '%'),
        }, {
          name: Like('%' + rest + '%'),
        }],
      });

      if (results.length === 0) {
        return 'No results';
      }

      return 'Search results:\n' + results.map(e => `- ${e.name} — @${e.slug} (#${e.id})`).join('\n');
    });

    cli.command('get', async rest => {
      const result = await userRepository.findOne({
        slug: rest,
      });

      if (!result) {
        return 'User not found';
      }

      return result;
    });

    cli.command('switch', async rest => {
      if (!rest) {
        return `Current user is #${this.currentUserId}`;
      }

      if (!Number(rest)) {
        return 'Invalid user ID.';
      }

      const user = await userRepository.findOne({ id: Number(rest) });
      if (!user) {
        return 'User not found.';
      }

      this.currentUserId = user.id;
      return `You now act on behalf of @${user.slug} (#${user.id})`;
    });

    return cli;
  }

  private getDayQuestionCli() {
    const repository = this.db.getRepository(DayQuestion);

    const cli = new CliListener(CliHelper.formatHelp(
      'day-question', {
        commands: {
          lookup: 'Lookup available day questions',
          delete: 'Delete a day question matching the exact ID',
          get: 'Get a day question by ID',
          'set-active': 'Force a day question to be set',
          'remove-active': 'If any, remove the active day question',
        },
        description: 'Manage registered daily questions in QuestionIt.space\n',
      }
    ));

    cli.command('lookup', rest => {
      return repository.createQueryBuilder('q')
        .where(`unaccent("q"."content"->>'fr') ILIKE '%' || unaccent(:rest) || '%'`, { rest })
        .orWhere(`unaccent("q"."content"->>'en') ILIKE '%' || unaccent(:rest) || '%'`, { rest })
        .take(10)
        .getMany();
    });

    cli.command('delete', async rest => {
      if (!rest) {
        return 'Please specify a ID';
      }

      const dayQuestion = await repository.findOne({ where: { id: Number(rest) } });

      if (!dayQuestion) {
        return 'Day question not found';
      }

      await repository.delete({ id: dayQuestion.id });
      return 'Day question deleted.';
    });

    cli.command('get', async rest => {
      const results = await repository.findOne({ where: { id: Number(rest) } });

      if (!results) {
        return 'No results';
      }

      return results;
    });

    cli.command('set-active', async rest => {
      const results = await repository.findOne({ where: { id: Number(rest) } });

      if (!results) {
        return 'Not found';
      }

      // TODO: Make this consistent in a multi-server setup
      // @ts-ignore
      config.DAY_QUESTIONS.FORCED_CURRENT = results.id;
      return `Active day question is now #${results.id}`;
    });

    cli.command('remove-active', () => {
      // @ts-ignore
      config.DAY_QUESTIONS.FORCED_CURRENT = null;
      return `No active day question`;
    });

    return cli;
  }
}
