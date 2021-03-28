# Contributing to resily

First of all, we are really happy for you to contribute, and thank you very much!

We would like you to follow the following set of guidelines.

## Code of Conduct

This project and everyone participating in it is governed by the [Diplomatiq Code of Conduct](https://github.com/Diplomatiq/resily/blob/main/CODE_OF_CONDUCT.md). By participating in any of our projects, you are expected to comply with our Code of Conduct. Please do not hesitate to report unacceptable behaviour to [conduct@diplomatiq.org](mailto:conduct@diplomatiq.org).

## Questions and problems

Open an issue to discuss any questions or problems. Make sure to label them with either `question` or `discussion`.

## Reporting bugs

If you found a bug, please help us by [submitting an issue](#submit-issue) to our GitHub repository. We will be very happy if you also [submit a pull request](#submit-pr) with a fix.

## Requesting features

You can request a feature by [submitting an issue](#submit-issue) to our GitHub repository.

If you want to implement a new feature, please [submit an issue](#submit-issue) first with the proposed solution. This way we can discuss details.

## Submission guidelines

### <a name="submit-issue"></a> Submitting issues

Before you submit an issue, please search for any similar issues in the issue tracker. Your problem or request may already exists, and there may even be some progress on it.

If you report a bug, please use the [Bug report](https://github.com/Diplomatiq/resily/issues/new?template=00_bug_report.md) issue template. The template contains all information that you need in order to create a perfect bug report. Please fill the template thoroughly.

If you request a feature, use the [Feature request](https://github.com/Diplomatiq/resily/issues/new?template=10_feature_request.md) issue template. If you have a solution or partial solution in mind, tell us.

### <a name="submit-pr"></a> Submitting code via pull requests

The following guidelines make easier to maintain a high-quality code base.

1. Branch from `main`.
2. Create your improvement to the code base.

    - Make sure to follow the [style guide](#style-guide).
    - Make sure to run all tests after your development.
    - Make sure to maintain the 100% test coverage.
    - Make sure to update the documentation if necessary.
    - The CI process will guide you. If it passes, good job! If it fails, it tells you why.

3. Submit your improvement in a pull request.

    - A submitted pull request should have exactly one commit. If you have multiple commits, please squash them into one commit.
    - The commit message should follow our [commit message guidelines](#commit-messages).

4. If we request changes, please commit the changes, then resquash and rebase if necessary.

## Style guide

### <a name="code-style"></a> Code style

The project uses [Prettier](https://prettier.io) as its style guide. For Visual Studio Code, you can install the [extension for Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), which auto-formats your code according to our style guide (in `.prettierrc.json`).

### <a name="commit-messages"></a> Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org). This leads to more readable messages that are easy to follow when looking through the project history. It is also used to generate the change log.

Commits are linted with [commitlint](https://commitlint.js.org). Its config is in `.commitlintrc.json`.

Each commit message should consist of a mandatory **header** (type & subject), an optional **body** and a mandatory **footer**.

The full commit message should look like the following:

```
<type>: <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** cannot be longer than 72 characters.

#### Type

Must be one of the following:

-   `build`: made the code better by enhancing the flow of building the distribution artefact
-   `chore`: made the code better by some housekeeping
-   `ci`: made the code better by enhancing the flow of merging/deploying additional code
-   `docs`: made the code better by writing better documentation
-   `feat`: made the code better by adding or improving a feature
-   `fix`: made the code better by fixing a bug
-   `perf`: made the code better in performance
-   `refactor`: made the code better in structure
-   `revert`: made the code better by deleting something that made the code worse
-   `style`: made the code better in style
-   `test`: made the code better by testing it better

#### Scope

We do not use scopes in this project.

#### Subject

The subject should contain a succint description of the change. Please note the following:

-   capitalize the first letter ("Add feature" not "add feature")
-   use the present tense ("Add feature" not "Added feature")
-   use the imperative mood ("Add feature" not "Adds feature")
-   do not put a dot (.) character at the end

#### Body

The body should consist of one or more meaningful, imperative sentences in the present tense. Each sentence should end with a dot (.) character.

All BREAKING CHANGE entries must be put at the beginning of the body, each starting with `BREAKING CHANGE:` label.

The body should include the motivation for the change and contrast this with previous behavior.

#### Footer

The footer must contain only a closing reference to the closed issue as a sentence in the following form: `Closes #55.`

#### Example

```
ci: Configure auto-badge bot for pull requests

Closes #23.
```

```
test: Add tests for randomness and uniformity

This commit contains test additions only. The tests are positive if the generated random values comply with NIST recommendations.

Closes #45.
```

```
feat: Add support for generating random BigInts

BREAKING CHANGE: With introducing BigInts, regular integer random generation feature is removed.

When generating random numbers for PKI, BigInts are a necessary replacement of integers.

Closes #105.
```
