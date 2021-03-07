import Evented from '@ember/object/evented';
import RSVP from 'rsvp';
import Service, {inject as service} from '@ember/service';
import {computed} from '@ember/object';

export default Service.extend(Evented, {

    ghostPaths: service(),
    session: service(),

    // this service is responsible for managing tour item visibility and syncing
    // the viewed state with the server
    //
    // tour items need to be centrally defined here so that we have a single
    // source of truth for marking all tour items as viewed
    //
    // a <GhTourItem @trobberId="unique-id"/> component can be inserted in any template,
    // this will use the tour service to grab content and determine visibility
    // with the component in control of rendering the throbber/controlling the
    // modal - this allows the component lifecycle hooks to perform automatic
    // display/cleanup when the relevant UI is visible.

    viewed: null,

    // IDs should **NOT** be changed if they have been part of a release unless
    // the re-display of the throbber should be forced. In that case it may be
    // useful to add a version number eg. `my-feature` -> `my-feature-v2`.
    // Format is as follows:
    //
    // {
    //     id: 'test',
    //     title: 'This is a test',
    //     message: 'This is a test of our <strong>feature tour</strong> feature'
    // }
    //
    // TODO: it may be better to keep this configuration elsewhere to keep the
    // service clean. Eventually we'll want apps to be able to register their
    // own throbbers and tour content
    throbbers: null,

    init() {
        this._super(...arguments);
        let adminUrl = `${window.location.origin}${this.get('ghostPaths.url').admin()}`;
        let adminDisplayUrl = adminUrl.replace(`${window.location.protocol}//`, '');

        this.viewed = [];

        this.throbbers = [{
            id: 'getting-started',
            title: 'Empezando con Ghost',
            message: `¡Bienvenido a Ghost Admin! Desde aquí puede navegar por su sitio, administrar su contenido y editar su configuración.<br><br>Siempre puede iniciar sesión en Ghost Admin visitando <a href="${adminUrl}" target="_blank">${adminDisplayUrl}</a>`
        }, {
            id: 'using-the-editor',
            title: 'Usando el editor Ghost',
            message: 'Ghost usa Markdown para permitirle escribir y formatear contenido de forma rápida y sencilla. ¡Esta barra de herramientas también ayuda! Clickear el ícono <strong>?</strong> para más accesos directos del editor.'
        }, {
            id: 'featured-post',
            title: 'Configurar una publicación destacada',
            message: 'Dependiendo de su tema, las publicaciones destacadas reciben un estilo especial para que se destaquen como una historia particularmente importante o enfatizada.'
        }, {
            id: 'upload-a-theme',
            title: 'Personalizando su publicación',
            message: 'Al usar temas personalizados, puede controlar completamente la apariencia de su sitio para que se adapte a su marca. Aquí hay una guía completa para ayudar: <strong><a href="https://ghost.org/docs/themes/" target="_blank">https://ghost.org/docs/themes/</a></strong>'
        }];
    },

    _activeThrobbers: computed('viewed.[]', 'throbbers.[]', function () {
        // return throbbers that haven't been viewed
        let viewed = this.viewed;
        let throbbers = this.throbbers;

        return throbbers.reject(throbber => viewed.includes(throbber.id));
    }),

    // retrieve the IDs of the viewed throbbers from the server, always returns
    // a promise
    fetchViewed() {
        return this.get('session.user').then((user) => {
            let viewed = user.get('tour') || [];

            this.set('viewed', viewed);

            return viewed;
        });
    },

    // save the list of viewed throbbers to the server overwriting the
    // entire list
    syncViewed() {
        let viewed = this.viewed;

        return this.get('session.user').then((user) => {
            user.set('tour', viewed);

            return user.save();
        });
    },

    // returns throbber content for a given ID only if that throbber hasn't been
    // viewed. Used by the <GhTourItem /> component to determine visibility
    activeThrobber(id) {
        let activeThrobbers = this._activeThrobbers;
        return activeThrobbers.findBy('id', id);
    },

    // when a throbber is opened the component will call this method to mark
    // it as viewed and sync with the server. Always returns a promise
    markThrobberAsViewed(id) {
        let viewed = this.viewed;

        if (!viewed.includes(id)) {
            viewed.pushObject(id);
            this.trigger('viewed', id);
            return this.syncViewed();
        } else {
            return RSVP.resolve(true);
        }
    },

    // opting-out will use the list of IDs defined in this file making it the
    // single-source-of-truth and allowing future client updates to control when
    // new UI should be surfaced through tour items
    optOut() {
        let allThrobberIds = this.throbbers.mapBy('id');

        this.set('viewed', allThrobberIds);
        this.trigger('optOut');

        return this.syncViewed();
    },

    // this is not used anywhere at the moment but it's useful to use via ember
    // inspector as a reset mechanism
    reEnable() {
        this.set('viewed', []);
        return this.syncViewed();
    }

});
