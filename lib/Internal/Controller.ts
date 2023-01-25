/*
 * This file is part of the Companion project
 * Copyright (c) 2018 Bitfocus AS
 * Authors: William Viker <william@bitfocus.io>, Håkon Nessjøen <haakon@bitfocus.io>
 *
 * This program is free software.
 * You should have received a copy of the MIT licence as well as the Bitfocus
 * Individual Contributor License Agreement for companion along with
 * this program.
 *
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the Companion software without
 * disclosing the source code of your own applications.
 *
 */

import CoreBase from '../Core/Base.js'
import ActionRecorder from './ActionRecorder.js'
import Instance from './Instance.js'
import Time from './Time.js'
import Controls from './Controls.js'
import CustomVariables from './CustomVariables.js'
import Surface from './Surface.js'
import System from './System.js'
import Triggers from './Triggers.js'
import Variables from './Variables.js'
import { cloneDeep } from 'lodash-es'
import { ParseControlId } from '../Shared/ControlId.js'
import type { ActionInstance, Registry, RunActionExtras } from '../tmp.js'
import type { InternalFragment } from './FragmantBase.js'
import type { InstanceStatus } from '../Instance/Status.js'

export default class InternalController extends CoreBase {
	feedbacks = new Map()

	fragments: InternalFragment[]

	constructor(registry: Registry) {
		super(registry, 'internal', 'Internal/Controller')

		this.fragments = [
			new ActionRecorder(registry),
			new Instance(registry),
			new Time(registry),
			new Controls(registry),
			new CustomVariables(registry),
			new Surface(registry),
			new System(registry),
			new Triggers(registry),
			new Variables(registry),
		]

		// Set everything up
		this.#regenerateActions()
		this.#regenerateFeedbacks()
		this.regenerateVariables()
	}

	init() {
		// Find all the feedbacks on banks
		const allControls = this.registry.controls.getAllControls()
		for (const [controlId, control] of Object.entries(allControls)) {
			// Discover feedbacks to process
			if (control.feedbacks && control.feedbacks.feedbacks) {
				for (const feedback of control.feedbacks.feedbacks) {
					if (feedback.instance_id === 'internal') {
						this.feedbackUpdate(feedback, controlId)
					}
				}
			}

			// Discover actions to process
			if (control.actionReplace && typeof control.getAllActions === 'function') {
				const actions = control.getAllActions()

				for (const action of actions) {
					if (action.instance === 'internal') {
						// Try and run an upgrade
						const newAction = this.actionUpgrade(action)
						if (newAction) {
							control.actionReplace(newAction)
						}
					}
				}
			}
		}

		// Make all variables values
		for (const fragment of this.fragments) {
			if (typeof fragment.updateVariables === 'function') {
				fragment.updateVariables()
			}
		}
	}

	/**
	 * Perform an upgrade for an action wh
	 * @param {object} action
	 * @param {*} controlId
	 */
	actionUpgrade(action, controlId: string) {
		for (const fragment of this.fragments) {
			if (typeof fragment.actionUpgrade === 'function') {
				try {
					const newAction = fragment.actionUpgrade(action, controlId)
					if (newAction !== undefined) {
						newAction.actionId = newAction.action
						// It was handled, so break
						return newAction
					}
				} catch (e) {
					this.logger.silly(
						`Action upgrade failed: ${JSON.stringify(action)}(${controlId}) - ${e?.message ?? e} ${e?.stack}`
					)
				}
			}
		}

		return undefined
	}
	// 	feedbackUpgrade(feedback, controlId) {
	// 		//
	// 	}

	feedbackUpdate(feedback, controlId: string) {
		if (feedback.instance_id !== 'internal') throw new Error(`Feedback is not for internal instance`)
		if (feedback.disabled) return

		const parsedId = ParseControlId(controlId)

		const cloned = {
			...cloneDeep(feedback),
			controlId,
			info: {
				page: parsedId?.page,
				bank: parsedId?.bank,
			},
		}
		this.feedbacks.set(feedback.id, cloned)

		this.registry.controls.updateFeedbackValues('internal', [
			{
				id: feedback.id,
				controlId: controlId,
				value: this.#feedbackGetValue(cloned),
			},
		])

		// TODO - unhandled
	}
	feedbackDelete(feedback) {
		if (feedback.instance_id !== 'internal') throw new Error(`Feedback is not for internal instance`)

		this.feedbacks.delete(feedback.id)
	}
	#feedbackGetValue(feedback) {
		for (const fragment of this.fragments) {
			if (typeof fragment.executeFeedback === 'function') {
				let value
				try {
					value = fragment.executeFeedback(feedback)
				} catch (e) {
					this.logger.silly(`Feedback check failed: ${JSON.stringify(feedback)} - ${e?.message ?? e} ${e?.stack}`)
				}

				if (value !== undefined) {
					// We are done
					return value
				}
			}
		}

		return undefined
	}

	executeAction(action: ActionInstance, extras: RunActionExtras): boolean | undefined {
		for (const fragment of this.fragments) {
			if (typeof fragment.executeAction === 'function') {
				try {
					if (fragment.executeAction(action, extras) !== undefined) {
						// It was handled, so break
						return
					}
				} catch (e) {
					this.logger.warn(
						`Action execute failed: ${JSON.stringify(action)}(${JSON.stringify(extras)}) - ${e?.message ?? e} ${
							e?.stack
						}`
					)
				}
			}
		}

		return false
	}

	setVariables(variables) {
		this.registry.instance.variable.setVariableValues('internal', variables)
	}
	checkFeedbacks(...types: string[]) {
		const typesSet = new Set(types)

		const newValues = []

		for (const [id, feedback] of this.feedbacks.entries()) {
			if (typesSet.size === 0 || typesSet.has(feedback.type)) {
				newValues.push({
					id: id,
					controlId: feedback.controlId,
					value: this.#feedbackGetValue(feedback),
				})
			}
		}

		this.registry.controls.updateFeedbackValues('internal', newValues)
	}
	checkFeedbacksById(...ids: string[]) {
		const newValues = []

		for (const id of ids) {
			const feedback = this.feedbacks.get(id)
			if (feedback) {
				newValues.push({
					id: id,
					controlId: feedback.controlId,
					value: this.#feedbackGetValue(feedback),
				})
			}
		}

		this.registry.controls.updateFeedbackValues('internal', newValues)
	}
	#regenerateActions() {
		let actions = {}

		for (const fragment of this.fragments) {
			if (typeof fragment.getActionDefinitions === 'function') {
				actions = {
					...actions,
					...fragment.getActionDefinitions(),
				}
			}
		}

		this.registry.instance.definitions.setActionDefinitions('internal', actions)
	}
	#regenerateFeedbacks() {
		let feedbacks = {}

		for (const fragment of this.fragments) {
			if (typeof fragment.getFeedbackDefinitions === 'function') {
				feedbacks = {
					...feedbacks,
					...fragment.getFeedbackDefinitions(),
				}
			}
		}

		this.registry.instance.definitions.setFeedbackDefinitions('internal', feedbacks)
	}
	regenerateVariables() {
		const variables = []

		for (const fragment of this.fragments) {
			if (typeof fragment.getVariableDefinitions === 'function') {
				variables.push(...fragment.getVariableDefinitions())
			}
		}

		this.registry.instance.variable.setVariableDefinitions('internal', variables)
	}

	// HACK - Can we avoid having everything make calls into this or its children?
	calculateInstanceErrors(instance_statuses: Record<string, InstanceStatus | undefined>): void {
		for (const fragment of this.fragments) {
			if (typeof fragment.calculateInstanceErrors === 'function') {
				fragment.calculateInstanceErrors(instance_statuses)
			}
		}
	}
	// HACK - Can we avoid having everything make calls into this or its children?
	variablesChanged(changed_variables: Record<string, any>, removed_variables: string[]): void {
		for (const fragment of this.fragments) {
			if (typeof fragment.variablesChanged === 'function') {
				fragment.variablesChanged(changed_variables, removed_variables)
			}
		}
	}
}
