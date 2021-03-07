import PostsController from './posts';

const TYPES = [{
    name: 'Todas las páginas',
    value: null
}, {
    name: 'Páginas borradores',
    value: 'draft'
}, {
    name: 'Páginas publicadas',
    value: 'published'
}, {
    name: 'Páginas programadas',
    value: 'scheduled'
}, {
    name: 'Páginas destacadas',
    value: 'featured'
}];

const ORDERS = [{
    name: 'Recientes',
    value: null
}, {
    name: 'Antiguas',
    value: 'published_at asc'
}, {
    name: 'Actualizadas recientemente',
    value: 'updated_at desc'
}];

/* eslint-disable ghost/ember/alias-model-in-controller */
export default PostsController.extend({
    init() {
        this._super(...arguments);
        this.availableTypes = TYPES;
        this.availableOrders = ORDERS;
    },

    actions: {
        openEditor(page) {
            this.transitionToRoute('editor.edit', 'page', page.get('id'));
        }
    }
});
