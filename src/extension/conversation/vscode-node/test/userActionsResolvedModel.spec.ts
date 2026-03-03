/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, test } from 'vitest';
import { ChatFetchResponseType, type ChatResponse } from '../../../../platform/chat/common/commonTypes';
import type { IResultMetadata } from '../../../prompt/common/conversation';

/**
 * Verifies that resolvedModel is correctly extracted from a successful ChatResponse
 * and included in the IResultMetadata fragment. This mirrors the logic in
 * DefaultIntentRequestHandler.getResult() that constructs the metadataFragment.
 */
describe('resolvedModel in result metadata', () => {
	function buildMetadataFragment(response: ChatResponse): Partial<IResultMetadata> {
		return {
			resolvedModel: response.type === ChatFetchResponseType.Success ? response.resolvedModel : undefined,
		};
	}

	test('captures resolvedModel from a successful response', () => {
		const response: ChatResponse = {
			type: ChatFetchResponseType.Success,
			value: 'hello',
			requestId: 'req-1',
			serverRequestId: 'srv-1',
			usage: undefined,
			resolvedModel: 'gpt-4o',
		};

		const fragment = buildMetadataFragment(response);
		expect(fragment.resolvedModel).toBe('gpt-4o');
	});

	test('resolvedModel is undefined for non-success responses', () => {
		const response: ChatResponse = {
			type: ChatFetchResponseType.Canceled,
			requestId: 'req-1',
			serverRequestId: 'srv-1',
			reason: 'cancelled',
		};

		const fragment = buildMetadataFragment(response);
		expect(fragment.resolvedModel).toBeUndefined();
	});

	test('resolvedModel is empty string when server returns empty model', () => {
		const response: ChatResponse = {
			type: ChatFetchResponseType.Success,
			value: 'hello',
			requestId: 'req-1',
			serverRequestId: 'srv-1',
			usage: undefined,
			resolvedModel: '',
		};

		const fragment = buildMetadataFragment(response);
		expect(fragment.resolvedModel).toBe('');
	});

	test('resolvedModel differs from requested model when auto resolves', () => {
		const response: ChatResponse = {
			type: ChatFetchResponseType.Success,
			value: 'hello',
			requestId: 'req-1',
			serverRequestId: 'srv-1',
			usage: undefined,
			resolvedModel: 'claude-sonnet-4',
		};

		const fragment = buildMetadataFragment(response);
		expect(fragment.resolvedModel).toBe('claude-sonnet-4');
	});
});

/**
 * Verifies that the resolvedModelId property is correctly included in
 * the telemetry properties for copy/insert/apply user actions.
 */
describe('resolvedModelId in user action telemetry properties', () => {
	function buildCopyInsertProperties(metadata: Partial<IResultMetadata> | undefined) {
		return {
			codeBlockIndex: '0',
			messageId: metadata?.modelMessageId ?? '',
			headerRequestId: metadata?.responseId ?? '',
			participant: 'test-agent',
			languageId: 'typescript',
			modelId: 'copilot-auto',
			resolvedModelId: metadata?.resolvedModel ?? '',
			comp_type: 'full' as const,
			mode: 'ask',
		};
	}

	function buildApplyProperties(metadata: Partial<IResultMetadata> | undefined) {
		return {
			codeBlockIndex: '0',
			messageId: metadata?.modelMessageId ?? '',
			headerRequestId: metadata?.responseId ?? '',
			participant: 'test-agent',
			languageId: 'typescript',
			modelId: 'copilot-auto',
			resolvedModelId: metadata?.resolvedModel ?? '',
			mode: 'ask',
		};
	}

	test('includes resolvedModelId when metadata has resolvedModel', () => {
		const metadata: Partial<IResultMetadata> = {
			modelMessageId: 'msg-1',
			responseId: 'resp-1',
			resolvedModel: 'gpt-4o',
		};

		const copyProps = buildCopyInsertProperties(metadata);
		expect(copyProps.resolvedModelId).toBe('gpt-4o');

		const applyProps = buildApplyProperties(metadata);
		expect(applyProps.resolvedModelId).toBe('gpt-4o');
	});

	test('defaults resolvedModelId to empty string when metadata is undefined', () => {
		const copyProps = buildCopyInsertProperties(undefined);
		expect(copyProps.resolvedModelId).toBe('');

		const applyProps = buildApplyProperties(undefined);
		expect(applyProps.resolvedModelId).toBe('');
	});

	test('defaults resolvedModelId to empty string when resolvedModel is missing', () => {
		const metadata: Partial<IResultMetadata> = {
			modelMessageId: 'msg-1',
			responseId: 'resp-1',
		};

		const copyProps = buildCopyInsertProperties(metadata);
		expect(copyProps.resolvedModelId).toBe('');

		const applyProps = buildApplyProperties(metadata);
		expect(applyProps.resolvedModelId).toBe('');
	});
});
