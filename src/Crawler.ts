import { CONTAINER_NODE_TYPES } from './constants';

/**
 * @description A class to handle traversing an array of selected items and return useful items
 * (child layers, first in selection, layer position, dimensions and position of layer gaps
 * and overlapping layer negative space).
 *
 * @class
 * @name Crawler
 *
 * @constructor
 *
 * @property selectionArray The array of selected items.
 */
export default class Crawler {
  array: Array<SceneNode>;
  constructor({ for: selectionArray }) {
    this.array = selectionArray;
  }

  /**
   * @description Returns the first item in the array.
   *
   * @kind function
   * @name first
   * @returns {Object} The first layer item in the array.
   */
  first() {
    return this.array[0];
  }

  /**
   * @description Looks into the selection array for any groups and pulls out individual layers,
   * effectively flattening the selection.
   *
   * @kind function
   * @name all
   *
   * @returns {Object} All items (including children) individual in an updated array.
   */
  all() {
    const initialSelection = this.array;
    const flatSelection = [];

    // iterate through initial selection
    initialSelection.forEach((layer: any) => {
      if (
        layer.type !== CONTAINER_NODE_TYPES.group
        && layer.type !== CONTAINER_NODE_TYPES.frame
        && layer.type !== CONTAINER_NODE_TYPES.component
        && layer.type !== CONTAINER_NODE_TYPES.instance
      ) {
        // non-frame or -group layers get added to the final selection
        flatSelection.push(layer);
      } else {
        // +++ frames and groups are checked for child layers

        // set initial holding array and add first level of children
        let innerLayers = [];
        layer.children.forEach(child => innerLayers.push(child));

        /**
         * @description Iterates through `innerLayers`, adding normal layers to the `flatSelection`
         * array, while adding any additional children layers into the `innerLayers` array.
         *
         * @kind function
         * @name iterateKnownChildren
         * @returns {null}
         *
         * @private
         */
        const iterateKnownChildren = (): void => {
          // iterate through known child layers in `innerLayers`,
          // adding more children to the array as they are found in descendent layers
          innerLayers.forEach((
            innerLayer: {
              children: any,
              id: string,
              type: string,
            },
          ) => {
            if (
              innerLayer.type !== CONTAINER_NODE_TYPES.group
              && innerLayer.type !== CONTAINER_NODE_TYPES.frame
              && innerLayer.type !== CONTAINER_NODE_TYPES.component
              && innerLayer.type !== CONTAINER_NODE_TYPES.instance
            ) {
              // non-frame or -group layers get added to the final selection
              flatSelection.push(innerLayer);
            } else {
              innerLayer.children.forEach(child => innerLayers.push(child));
            }

            // update the overall list of child layers, removing the layer that was just examined.
            // this array should eventually be empty, breaking the `while` loop
            const innerLayerIndex = innerLayers.findIndex(
              foundInnerLayer => (foundInnerLayer.id === innerLayer.id),
            );
            innerLayers = [
              ...innerLayers.slice(0, innerLayerIndex),
              ...innerLayers.slice(innerLayerIndex + 1),
            ];
          });

          return null;
        };

        // loop through the `innerLayers` array as long as it is not empty
        while (innerLayers.length > 0) {
          iterateKnownChildren();
        }
      }
    });

    return flatSelection;
  }

  /**
   * @description Looks into the selection array for any groups and pulls out individual layers,
   * effectively flattening the selection.
   *
   * @kind function
   * @name allSorted
   *
   * @returns {Object} All items (including children) individual in an updated array.
   */
  allSorted() {
    // start with flattened selection of all layers
    const layers = this.all();

    // sort by `x` and `y`, weighted toward preferring `y`
    const sortByPosition = (nodeA, nodeB) => {
      const aPos = { x: nodeA.absoluteTransform[0][2], y: nodeA.absoluteTransform[1][2] };
      const bPos = { x: nodeB.absoluteTransform[0][2], y: nodeB.absoluteTransform[1][2] };

      if (Math.abs(aPos.y - bPos.y) > Math.abs(aPos.x - bPos.x)) {
        return aPos.y - bPos.y;
      }
      return aPos.x - bPos.x;
    };

    const sortedLayers = layers.sort(sortByPosition);
    return sortedLayers;
  }

  /**
   * @description Looks into the selection array for any groups and pulls out
   * individual TextNode layers.
   *
   * @kind function
   * @name text
   * @param {boolean} includeLocked Determines whether or not locked layers are included
   * in the selection.
   *
   * @returns {Array} All TextNode items in an array.
   */
  text(includeLocked: boolean = false): Array<TextNode> {
    // start with flattened selection of all layers, ordered by position on the artboard
    const layers = this.allSorted();

    // filter and retain immediate text nodes
    let textNodes: Array<TextNode> = layers.filter((node: SceneNode) => node.type === 'TEXT');

    // iterate through components to find additional text nodes
    const componentNodes: Array<ComponentNode | InstanceNode> = layers.filter(
      (node: SceneNode) => (
        (node.type === 'COMPONENT' || node.type === 'INSTANCE') && node.visible
      ),
    );
    if (componentNodes) {
      componentNodes.forEach((componentNode: ComponentNode | InstanceNode) => {
        // find text node inside components
        const innerTextNodesUntyped: any = componentNode.findAll(
          (node: SceneNode) => node.type === 'TEXT',
        );
        const innerTextNodes: Array<TextNode> = innerTextNodesUntyped.filter(
          (node: SceneNode) => node.type === 'TEXT',
        );

        if (innerTextNodes) {
          // add any text nodes to the overall selection
          innerTextNodes.forEach(innerTextNode => textNodes.push(innerTextNode));
        }
      });
    }

    // remove locked text nodes, if necessary
    if (!includeLocked) {
      textNodes = textNodes.filter((node: TextNode) => !node.locked);
    }

    return textNodes;
  }
}
