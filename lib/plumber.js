/**
 * The plumber is the master of all the drains in the system (funny,
 * right). This module contains all the logic for selecting the right
 * drain to use for communication at that moment in time.
 *
 * Design Questions:
 *   - Does it make sense to have multiple plumbers in the system?
 *
 *   - Do we need to support single set of routing rules or multiple
 *     routing rules?
 *
 *   - Should the plumber also keep track of the stat info regarding
 *     the drains or do drains keep their own stats?
 *
 *     Drains should keep track of their own stats and the plumber can
 *     aggerate these stats into a unified view. This reduces the state
 *     in the plumber and also means that reaping drains with poor
 *     performance will instantly make the system better.
 *
 *   - Does the plumber keep track of roughly how much money it's spending
 *     or should another process perform that work?
 *
 *   - Does the plumber need to guarantee some kind of durability of
 *     information in itself? (transaction logging?) If the process failed,
 *     is there state in the plumber that would matter?
 *
 *   - Where is the plumber going to get user information from?
 *
 * @module plumber
 */
