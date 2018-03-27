/*
 * Copyright (c) 2012-2018 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at 
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { injectable, inject } from "inversify";
import { GithubService, SshKeyPair, SshKeyServer } from '../common/github-service';
import { Repository, User, PullRequest, Organization, Collaborator, Properties } from '../common/github-model';

var GitHubApi = require('github');

@injectable()
export class GithubServiceImpl implements GithubService {

    constructor(@inject(SshKeyServer) protected readonly sshKeyServer: SshKeyServer) { }

    getRepository(owner: string, repository: string, properties?: Properties): Promise<Repository> {
        return this.getConnection(properties).repos.get({ owner: owner, repo: repository }).then((result: any) => {
            return new Promise<Repository>(resolve => { resolve(result.data) })
        });
    }

    getUserRepositories(user: string, pageNumber = 0, pageSize = 0, properties?: Properties): Promise<Repository[]> {
        return this.getConnection(properties).repos.getForUser({ username: user, page: pageNumber > 0 ? pageNumber : 0, per_page: pageSize }).then((result: any) => {
            return new Promise<Repository[]>(resolve => { resolve(result.data) })
        });
    }

    getOrganizationRepositories(organization: string, pageNumber = 0, pageSize = 0, properties?: Properties): Promise<Repository[]> {
        return this.getConnection(properties).repos.getForOrg({ org: organization, page: pageNumber > 0 ? pageNumber : 0, per_page: pageSize }).then((result: any) => {
            return new Promise<Repository[]>(resolve => { resolve(result.data) })
        });
    }

    getAllRepositories(pageNumber = 0, pageSize = 0, properties?: Properties): Promise<Repository[]> {
        return this.getConnection(properties).repos.getAll({ page: pageNumber > 0 ? pageNumber : 0, per_page: pageSize }).then(async (result: any) => {
            return new Promise<Repository[]>(resolve => { resolve(result.data) });
        });
    }

    getForks(owner: string, repository: string, pageNumber = 0, pageSize = 0, properties?: Properties): Promise<Repository[]> {
        return this.getConnection(properties).repos.getForks({ owner, repository, page: pageNumber > 0 ? pageNumber : 0, per_page: pageSize }).then((result: any) => {
            return new Promise<Repository[]>(resolve => { resolve(result.data) })
        });
    }

    createFork(owner: string, repository: string, properties?: Properties): Promise<void> {
        return this.getConnection(properties).repos.fork({ owner, repository }).then((result: any) => {
            return new Promise<void>(resolve => { resolve(result.data) })
        });
    }

    commentIssue(owner: string, repository: string, id: number, comment: string, properties?: Properties): Promise<void> {
        return this.getConnection(properties).issues.createComment({ owner: owner, repo: repository, number: id, body: comment }).then((result: any) => {
            return new Promise<void>(resolve => { resolve(result.data) })
        });
    }

    getPullRequest(owner: string, repository: string, id: number, properties?: Properties): Promise<PullRequest> {
        return this.getConnection(properties).pullRequests.get({ owner: owner, repo: repository, number: id }).then((result: any) => {
            return new Promise<PullRequest>(resolve => { resolve(result.data) })
        });
    }

    getPullRequests(owner: string, repository: string, pageNumber = 0, pageSize = 0, properties?: Properties): Promise<PullRequest[]> {
        return this.getConnection(properties).pullRequests.getAll({ owner: owner, repo: repository, page: pageNumber > 0 ? pageNumber : 0, per_page: pageSize }).then((result: any) => {
            return new Promise<PullRequest[]>(resolve => { resolve(result.data) })
        });
    }

    createPullRequest(owner: string, repository: string, head: string, base: string, title: string, properties?: Properties): Promise<void> {
        return this.getConnection(properties).pullRequests.create({ owner: owner, repo: repository, head: head, base: base, title: title }).then((result: any) => {
            return new Promise<void>(resolve => { resolve(result.data) })
        });
    }

    updatePullRequest(owner: string, repository: string, id: string, pullRequest: PullRequest, properties?: Properties): Promise<void> {
        return this.getConnection(properties).pullRequests.update({ owner: owner, repo: repository, number: id, title: pullRequest.title, body: pullRequest.body, state: pullRequest.state, base: pullRequest.base }).then((result: any) => {
            return new Promise<void>(resolve => { resolve(result.data) })
        });
    }

    getOrganizations(pageNumber = 0, pageSize = 0, properties?: Properties): Promise<Organization[]> {
        return this.getConnection(properties).users.getOrgs({ page: pageNumber > 0 ? pageNumber : 0, per_page: pageSize }).then((result: any) => {
            return new Promise<Organization[]>(resolve => { resolve(result.data) })
        });
    }

    getCurrentUser(properties?: Properties): Promise<User> {
        return this.getConnection(properties).users.get({}).then((result: any) => {
            return new Promise<User>(resolve => { resolve(result.data) })
        });
    }

    getCollaborators(owner: string, repository: string, pageNumber = 0, pageSize = 0, properties?: Properties): Promise<Collaborator[]> {
        return this.getConnection(properties).repos.getCollaborators({ owner: owner, repo: repository, page: pageNumber > 0 ? pageNumber : 0, per_page: pageSize }).then((result: any) => {
            return new Promise<Collaborator[]>(resolve => { resolve(result.data) })
        });
    }

    uploadSshKey(title: string, properties?: Properties): Promise<void> {
        const service: string = 'vcs';
        const host: string = 'github.com';

        return this.sshKeyServer.get(service, host).then((SshKeyPair: SshKeyPair) => {
            if (SshKeyPair.publicKey = undefined) {
                return this.sshKeyServer.generate(service, host).then((SshKeyPair: SshKeyPair) => {
                    return this.getConnection(properties).users.createKey({ title: title, key: SshKeyPair.publicKey });
                });
            } else {
                return this.getConnection(properties).users.createKey({ title: title, key: SshKeyPair.publicKey });
            }
        });
    }

    protected getConnection(properties?: Properties) {
        if (properties) {
            const octokit = new GitHubApi({
                debug: true
            });
            octokit.authenticate(properties.credentials);
            return octokit;
        } else {
            return new GitHubApi({});
        }
    }
}
