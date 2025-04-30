---
title: Terraform LocalStack Testing
date: 2024-04-18
tags:
  - "#engineering/devops"
  - projects/dayjob/terraform-testing
  - notes/scratch
draft: false
---
## Primary Takeaways

There are two reasons AFT/AWS would want to buy into something like this:

1. Ability to quickly iterate on the *validity* of AFT deployments
2. Ability to quickly iterate on the *functionality* of AWS infrastructure

I don't think I'd recommend Terraform LocalStack at the moment:

1. **Validity Testing:**
    - LocalStack, to some extent, butts up against AFT in such a way that *properly* vetting the validity of new deployments would, in essence, require not just emulating AWS but also AFT. To that end, there may be [better alternatives](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/validate-account-factory-for-terraform-aft-code-locally.html) for this that would both be less of a lift (as the code/process is already written) *and* get a more accurate test of validity against AFT infrastructure.
1. **Functionality:**
    - There is no question that we would need to buy into the full Pro version ($70/user/month) to get close to emulating the particular services we're interested in — namely, critical pieces such as Cognito.
    - Being able to quickly test in LocalStack's Pro version wouldn't negate the cost we would need to *also* test these pieces on actual AWS infrastructure. In effect, we'd be double-paying for a partially-emulated environment.
    - The alternative to this may be to continue focusing on end-to-end testing in the already-existing AWS development environments, allowing us to programmatically test on infrastructure that (should ideally, with AFT) be a near-direct mirror of the application production environments.

## [Hashicorp Demo Video](https://www.youtube.com/watch?v=DDa1PcHRQ4I)

### [Demo Section](https://youtu.be/DDa1PcHRQ4I?si=ZKzMLKGAfttcp94n&t=419)

- SPIKE Reference: HashiCorp Deploy
    - TODO
- Demo for a lambda reading into an S3 bucket
- Application for AFT would need to be in multiple steps — particularly, global customizations into account customizations
    - Environment would need to preemptively load an additional layer for the account request resources, but this should be trivial - would need to be starter account system variables in [TODO: SERVICE NAME]
- Goes over the particulars of the infrastructure they're attempting to deploy - should be arbitrary, but we'd want to set up a specific test account for our purposes. `sandbox` is comin' back, baybeeeeee
- SPIKE Reference: LocalStack Docs
    - TODO
    - Localstack extensions (labelled alternatives in the docs)
        - This seems to reference a docker compose system, which makes sense, since AWS is made of a bajillion different services. This might be the approach, as we realistically only need the 6-7 services that we tend to use (+ dependencies for those services)
- **DOCKER COMPOSE**
    - Debug level to see output - requires passthrough of docker socket and a localstack local volume
    - TODO: Mermaid graph of interaction between local terraform instance, LocalStack docker stack, actual AWS account
    - NOTE: The concern I'd have is the frequency at which AWS updates and cadence at which LocalStack would update alongside it. I would have concerns about having tests passing here as a hard requirement for merging in a PR.
        - That said, this would still be invaluable as both a local development tool *and* a canary-in-the-coalmine with incoming deployments.
        - SPIKE: Broadcasting non-blocking warning outputs in GitHub Actions
- Goes in-depth on a practical example, not necessarily needed.
- **AWS SERVICE FEATURE COVERAGE**:
    - This lends itself to the amount of drift between LocalStack and AWS itself - thankfully, they seem to be documenting this well.
    - Considering this video was released 5 months ago, I doubt this has halted development.
    - Community and Pro Versions
    - LocalStack Actions Integrations

#### TAKEAWAYS:

1. We would likely go with the Docker Compose version, selecting specific services to use.
2. Because we have the additional AFT layer on top of our "vanilla" terraform, there will likely be "degrees of correctness" to using this in our workflows:
    1. **BRONZE:** In the Customizations repository, we add the infrastructure to locally test a given account customization directory, adding a Compose file to each to declare which services the account actively requires.
    2. **SILVER:** We pull in the `requests` and `global-customizations` repositories, emulating the general "pipeline" that AFT provides us by applying the layers in the same order AFT would when we deploy a new account
    3. **GOLD:** We emulate (or more likely, see if somebody else has already tried to emulate) the Account Factory Terraform setup process, likely running two stacks: one for the AFT account + pipeline, and the other for the "new" account.
        - [I] Hold your *horses:* What if we created a "pure" LocalStack docker stack, applied the original Account Factory Terraform `.tf` file to *that*, and then just... built *that* into an image?
3. The ability to emulate the target test account as-is may not be feasible - in essence, setting up the LocalStack would only emulate a from-scratch deployment. Not necessarily a good or bad thing — just a consideration.

## [LocalStack Docs](https://docs.localstack.cloud/overview/)

1. **QUESTION:** Does LocalStack [offer good support](https://docs.localstack.cloud/user-guide/aws/feature-coverage/#emulation-levels) for the services we use?
    - NOTE: The two levels of emulation they offer are `CRUD` for response-only, and `Emulated` for actual logic emulation.
    - NOTE: Some services are locked behind the Pro version
    - **SUPPORT LEVELS**:
        1. RDS (Databases): `**, Emulated`
        2. Cognito: Locked in Pro, [variable support](https://docs.localstack.cloud/references/coverage/coverage_cognito-identity/)
        3. User Pools: `**-****, CRUD`
        4. VPCs: `***-****, CRUD`
        5. ECR: Locked in Pro, [variable support](https://docs.localstack.cloud/references/coverage/coverage_ecr/)
        6. ELB: Variable, v1 as `***, CRUD`, v2 as Pro feature
        7. Key Management Service: Pro
        8. Lambda: Pro

I'm going to pause here before researching any further. It appears that the cost here is $70/user/mo for LocalStack pro, and many of the services we'd hope to use it for appear to be locked in the Pro version.